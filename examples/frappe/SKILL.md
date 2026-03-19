---
name: frappe-patterns
description: >
  Frappe Framework and ERPNext development patterns. Use when working with
  DocTypes, controllers, hooks, whitelisted APIs, background jobs, client
  scripts, Jinja templates, Frappe Pages, Frappe UI (Vue 3), payment gateways,
  third-party integrations, fixtures, patches, or ERPNext customizations.
  Trigger on any mention of: bench, DocType, frappe.whitelist, hooks.py,
  child table, on_submit, validate, frappe.call, enqueue, fixtures, patches,
  ERPNext, Frappe UI, frappe-ui, RQ, Redis Queue, MariaDB with Frappe ORM.
triggers:
  - frappe
  - erpnext
  - doctype
  - bench
  - hooks.py
  - frappe.whitelist
  - frappe.call
  - child table
  - on_submit
  - on_cancel
  - frappe-ui
  - enqueue
  - fixtures
  - patches
  - mariadb frappe
---

# Frappe Framework & ERPNext Development Skill

## Overview

Frappe is an opinionated full-stack Python web framework built on top of MariaDB.
ERPNext is a business application suite built on Frappe. Development follows
strict conventions — always work within the framework, never against it.

**Golden Rule:** Never modify `frappe` or `erpnext` core source. All customizations
live in your custom app via hooks, Custom Fields, and overrides.

---

## 1. Project Architecture

```
apps/
  frappe/           # Core framework — READ ONLY
  erpnext/          # ERP app — READ ONLY (use customizations)
  <your_app>/
    <your_app>/
      doctype/        # DocTypes (schema + controllers)
      api/            # Whitelisted API endpoints
      hooks.py        # Event bindings + scheduler
      patches/        # DB migration patches (run once)
      fixtures/       # Exported config (Custom Fields, Roles, etc.)
      utils/          # Shared Python helpers
      integrations/   # Third-party service adapters
      public/js/      # Desk client scripts
      templates/      # Jinja2 templates
      www/            # Frappe Pages (public web)
    frontend/         # Frappe UI (Vue 3) — if separate SPA
```

---

## 2. DocType Controller Lifecycle

Controllers extend `Document`. Use the correct lifecycle hook for each action:

```python
import frappe
from frappe import _
from frappe.model.document import Document

class SalesInvoiceOverride(Document):

    # --- Validation (runs on every save) ---
    def validate(self):
        self.validate_due_date()
        self.calculate_totals()

    def before_save(self):
        """Last chance to modify before DB write."""
        self.set_title()

    # --- Insert lifecycle ---
    def before_insert(self):
        self.set_defaults_for_new_records()

    def after_insert(self):
        self.notify_relevant_parties()

    # --- Submit/Cancel (amend flow) ---
    def on_submit(self):
        self.create_gl_entries()

    def before_cancel(self):
        self.validate_cancellation_allowed()

    def on_cancel(self):
        self.reverse_gl_entries()

    # --- Delete ---
    def on_trash(self):
        self.validate_no_linked_records()

    # --- Helpers ---
    def validate_due_date(self):
        if self.due_date and self.due_date < self.posting_date:
            frappe.throw(_("Due Date cannot be before Posting Date"))
```

**Hook priority for lifecycle:**
`before_insert` → `validate` → `before_save` → DB write → `after_insert`/`after_save` → `on_submit`

---

## 3. Whitelisted APIs

```python
# api/customer_portal.py
import frappe
from frappe import _

@frappe.whitelist()
def get_customer_orders(customer=None, from_date=None):
    """Requires login. Respects DocType permissions."""
    frappe.has_permission("Sales Order", throw=True)

    filters = {"docstatus": 1}
    if customer:
        filters["customer"] = customer
    if from_date:
        filters["transaction_date"] = [">=", from_date]

    return frappe.get_list(
        "Sales Order",
        filters=filters,
        fields=["name", "customer", "grand_total", "status", "transaction_date"],
        order_by="transaction_date desc",
        page_length=50,
    )


@frappe.whitelist(allow_guest=True)
def public_health_check():
    """No login required — use sparingly, add rate limiting."""
    return {"status": "ok", "version": frappe.__version__}


@frappe.whitelist(methods=["POST"])
def create_support_ticket(subject, description, priority="Medium"):
    """POST-only endpoint."""
    doc = frappe.new_doc("Issue")
    doc.subject = subject
    doc.description = description
    doc.priority = priority
    doc.insert(ignore_permissions=False)
    return {"name": doc.name}
```

REST URL pattern: `POST /api/method/<app>.<module>.api.<file>.<function>`

---

## 4. hooks.py — Full Reference

```python
# hooks.py

app_name = "myapp"
app_title = "My App"
app_publisher = "My Company"
app_description = "Custom Frappe application"
app_version = "1.0.0"

# --- Scheduled Tasks ---
scheduler_events = {
    "all":    ["myapp.tasks.maintenance.every_minute"],   # Every minute (use carefully)
    "hourly": ["myapp.tasks.cleanup.remove_temp_files"],
    "daily":  ["myapp.tasks.sync.nightly_erp_sync"],
    "weekly": ["myapp.tasks.reports.weekly_summary"],
    "monthly":["myapp.tasks.archive.monthly_archive"],
    "cron": {
        "0 9 * * 1-5":  ["myapp.tasks.morning_digest"],   # Weekdays 9am
        "0 */4 * * *":  ["myapp.tasks.payment_status_check"],  # Every 4 hours
    },
}

# --- DocType Event Hooks ---
doc_events = {
    # Extend ERPNext behavior without modifying its source
    "Sales Order": {
        "validate":   "myapp.handlers.sales_order.validate",
        "on_submit":  "myapp.handlers.sales_order.on_submit",
        "on_cancel":  "myapp.handlers.sales_order.on_cancel",
    },
    "Payment Entry": {
        "on_submit":  "myapp.handlers.payment.on_submit",
    },
    # Wildcard — fires for all DocTypes
    "*": {
        "on_trash": "myapp.handlers.audit.log_deletion",
    },
}

# --- Override JS for ERPNext DocTypes ---
doctype_js = {
    "Sales Order":  "public/js/overrides/sales_order.js",
    "Purchase Order": "public/js/overrides/purchase_order.js",
}

# Override list views
doctype_list_js = {
    "Sales Order": "public/js/overrides/sales_order_list.js",
}

# --- Fixtures (export these to keep config in version control) ---
fixtures = [
    "Custom Field",
    "Custom Script",
    "Property Setter",
    "Role",
    {"dt": "Workflow", "filters": [["app", "=", "myapp"]]},
    {"dt": "Print Format", "filters": [["module", "=", "My Module"]]},
]

# --- Jinja Template Helpers ---
jinja = {
    "methods": [
        "myapp.utils.jinja.format_currency",
        "myapp.utils.jinja.get_company_details",
    ],
    "filters": [
        "myapp.utils.jinja.to_words",
    ],
}

# --- Website ---
website_route_rules = [
    {"from_route": "/portal/<name>", "to_route": "portal"},
    {"from_route": "/invoice/<name>", "to_route": "invoice-view"},
]

# --- After Migrate ---
after_migrate = ["myapp.setup.after_migrate"]

# --- Boot Session (injected into every page load) ---
boot_session = "myapp.startup.boot_session"
```

---

## 5. MariaDB & Frappe ORM Patterns

```python
# ✅ Preferred: Frappe ORM (permission-aware, safe)
doc = frappe.get_doc("Sales Order", "SO-00001")
frappe.get_list("Item",
    filters={"item_group": "Products", "disabled": 0},
    fields=["name", "item_name", "standard_rate"],
    order_by="item_name asc",
    page_length=100,
)
frappe.get_value("Customer", customer_name, "customer_group")
frappe.get_all("Address",   # get_all ignores permissions
    filters={"link_doctype": "Customer", "link_name": customer_name},
    fields=["address_line1", "city"],
)
frappe.db.set_value("Sales Order", so_name, "custom_field", value)
frappe.db.set_value("Sales Order", so_name, {
    "custom_field_1": val1,
    "custom_field_2": val2,
})

# ✅ Direct SQL — use only when ORM cannot express the query
results = frappe.db.sql("""
    SELECT
        so.name,
        so.customer,
        SUM(soi.amount) AS total_amount
    FROM `tabSales Order` so
    INNER JOIN `tabSales Order Item` soi ON soi.parent = so.name
    WHERE so.docstatus = 1
      AND so.transaction_date BETWEEN %(from_date)s AND %(to_date)s
      AND so.company = %(company)s
    GROUP BY so.name
    ORDER BY total_amount DESC
    LIMIT %(limit)s
""", {
    "from_date": from_date,
    "to_date": to_date,
    "company": company,
    "limit": 100,
}, as_dict=True)

# ❌ NEVER do this — SQL injection risk
# frappe.db.sql(f"SELECT * FROM `tabSales Order` WHERE name = '{name}'")

# Table naming: DocType "Sales Order" → `tabSales Order`
# Child DocType "Sales Order Item" → `tabSales Order Item`
```

---

## 6. Background Jobs (RQ / Redis)

```python
# Enqueue from controller or API
from frappe.utils.background_jobs import enqueue

def trigger_heavy_task(doc_name):
    enqueue(
        "myapp.tasks.process_document",
        queue="long",           # "default" (30m), "short" (5m), "long" (1h)
        timeout=3600,
        is_async=True,
        job_id=f"process_{doc_name}",  # Deduplication key
        doc_name=doc_name,
    )

# The background task
# myapp/tasks.py
import frappe

def process_document(doc_name):
    frappe.set_user("Administrator")  # Required in background context
    try:
        doc = frappe.get_doc("My DocType", doc_name)
        # ... heavy processing ...
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Process Document Failed")
        raise
```

**Queue selection:**
- `short` — quick tasks < 5 min (emails, notifications)
- `default` — standard tasks < 30 min (reports, syncs)
- `long` — heavy tasks < 1h (bulk imports, reconciliation)

---

## 7. Client Scripts (Desk JS)

```javascript
// doctype/sales_order/sales_order.js
frappe.ui.form.on('Sales Order', {

    // Form events
    refresh(frm) {
        // Add buttons conditionally
        if (frm.doc.docstatus === 1 && frm.doc.custom_status === 'Pending') {
            frm.add_custom_button(__('Process Payment'), () => {
                frappe.confirm(
                    __('Are you sure you want to process payment?'),
                    () => {
                        frappe.call({
                            method: 'myapp.api.payment.process',
                            args: { sales_order: frm.doc.name },
                            freeze: true,
                            freeze_message: __('Processing...'),
                            callback(r) {
                                if (r.message) {
                                    frappe.msgprint(__('Payment processed successfully'))
                                    frm.reload_doc()
                                }
                            }
                        })
                    }
                )
            }, __('Actions'))
        }
    },

    // Field change triggers
    customer(frm) {
        if (!frm.doc.customer) return
        frappe.call({
            method: 'myapp.api.customer.get_credit_limit',
            args: { customer: frm.doc.customer },
            callback(r) {
                frm.set_value('custom_credit_limit', r.message)
            }
        })
    },

    // Child table events
    'items.qty'(frm, cdt, cdn) {
        const row = locals[cdt][cdn]
        frappe.model.set_value(cdt, cdn, 'amount', row.qty * row.rate)
        frm.refresh_field('items')
    },
})
```

---

## 8. Frappe UI (Vue 3) Patterns

```vue
<!-- frontend/src/components/OrderList.vue -->
<template>
  <div>
    <ListView
      :columns="columns"
      :data="orders.data"
      :row-key="'name'"
    />
  </div>
</template>

<script setup>
import { createListResource } from 'frappe-ui'

const orders = createListResource({
  doctype: 'Sales Order',
  fields: ['name', 'customer', 'grand_total', 'status'],
  filters: { docstatus: 1 },
  orderBy: 'transaction_date desc',
  pageLength: 20,
  auto: true,
})

const columns = [
  { label: 'Order', key: 'name' },
  { label: 'Customer', key: 'customer' },
  { label: 'Total', key: 'grand_total' },
]
</script>
```

```javascript
// API call pattern
import { createResource } from 'frappe-ui'

const result = createResource({
  url: 'myapp.api.customer_portal.get_customer_orders',
  params: { customer: 'CUST-001' },
  auto: true,
  onSuccess(data) { console.log(data) },
  onError(err) { console.error(err) },
})

// Imperative call
result.fetch({ customer: 'CUST-002' })
```

---

## 9. Frappe Pages (www/) Pattern

```python
# www/invoice-view.py
import frappe
from frappe import _

def get_context(context):
    name = frappe.form_dict.get("name")
    if not name:
        frappe.throw(_("Invoice name required"), frappe.PermissionError)

    doc = frappe.get_doc("Sales Invoice", name)
    frappe.has_permission("Sales Invoice", doc=doc, throw=True)

    context.doc = doc
    context.title = f"Invoice {name}"
    context.no_cache = 1
```

```html
<!-- www/invoice-view.html -->
{% extends "templates/web.html" %}
{% block page_content %}
<div class="invoice-container">
    <h2>{{ doc.name }}</h2>
    <p>Customer: {{ doc.customer }}</p>
    <p>Amount: {{ doc.grand_total | money }}</p>
</div>
{% endblock %}
```

---

## 10. Patches (Data Migrations)

```python
# patches/v1_1/migrate_customer_type.py
import frappe

def execute():
    """Run once: migrate custom_customer_type field values."""
    # Always make patches idempotent
    if not frappe.db.has_column("Customer", "custom_customer_type"):
        return

    frappe.db.sql("""
        UPDATE `tabCustomer`
        SET custom_customer_type = 'Retail'
        WHERE custom_customer_type IS NULL
          OR custom_customer_type = ''
    """)
    frappe.db.commit()
```

Register in `patches.txt`:
```
myapp.patches.v1_1.migrate_customer_type
```

**Patch rules:**
- Must be idempotent (safe to run multiple times)
- Always check if column/field exists before modifying
- Commit explicitly at the end
- Never delete data without a backup step

---

## 11. Fixtures Management

```bash
# Export after making config changes in UI
bench --site <site> export-fixtures --app myapp

# Import on fresh site or after git pull
bench --site <site> import-fixtures --app myapp

# Always commit fixtures after UI config changes
git add myapp/fixtures/
git commit -m "chore(fixtures): export custom fields for Sales Order"
```

**What to put in fixtures:**
- Custom Fields, Property Setters, Custom Scripts
- Roles, Role Profiles
- Print Formats, Letter Heads
- Workflows specific to your app
- Email Templates

---

## 12. Payment Gateway Integration Pattern

```python
# integrations/payment_gateway.py
import frappe
import hmac
import hashlib
import requests
from frappe import _
from frappe.utils.background_jobs import enqueue

class RazorpayIntegration:

    def __init__(self):
        self.settings = frappe.get_cached_doc("Razorpay Settings")
        self.api_key = self.settings.api_key
        self.api_secret = self.settings.get_password("api_secret")
        self.base_url = "https://api.razorpay.com/v1"

    def create_order(self, amount_in_paise, currency="INR", receipt=None):
        response = requests.post(
            f"{self.base_url}/orders",
            auth=(self.api_key, self.api_secret),
            json={"amount": amount_in_paise, "currency": currency, "receipt": receipt},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()

    def verify_signature(self, order_id, payment_id, signature):
        """Verify webhook/callback signature."""
        message = f"{order_id}|{payment_id}"
        expected = hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            frappe.throw(_("Invalid payment signature"), frappe.PermissionError)

    def process_callback(self, payload, headers):
        self.verify_signature(
            payload["razorpay_order_id"],
            payload["razorpay_payment_id"],
            payload["razorpay_signature"],
        )
        enqueue(
            "myapp.integrations.payment_gateway.create_payment_entry",
            queue="default",
            payload=payload,
        )


def create_payment_entry(payload):
    """Background: create Payment Entry in ERPNext."""
    frappe.set_user("Administrator")
    # ... create frappe Payment Entry ...
    frappe.db.commit()
```

---

## 13. ERPNext Customization Patterns

| Goal | How |
|---|---|
| Add field to Sales Order | Custom Field via UI → export fixtures |
| Override Sales Order validate | `doc_events` in hooks.py |
| Add button to Sales Order form | `doctype_js` override in hooks.py |
| Extend Sales Order API | New whitelisted function in custom app |
| Custom report | New Report DocType in custom app |
| Custom print format | New Print Format (don't override default) |
| Change field properties | Property Setter → export to fixtures |

---

## 14. Security Checklist

- [ ] `frappe.has_permission()` called in every API before returning data
- [ ] No string interpolation in SQL — always parametrized
- [ ] Passwords stored in Password field type — never plaintext
- [ ] Webhook signatures verified before processing
- [ ] `allow_guest=True` endpoints have explicit validation
- [ ] File upload endpoints validate file type and size
- [ ] Cross-site scripting: use `frappe.utils.escape_html()` in Jinja
- [ ] Sensitive operations log to `frappe.log_error()` or audit trail

---

## 15. Common Anti-Patterns to Avoid

```python
# ❌ Committing inside validate
def validate(self):
    frappe.db.commit()  # NEVER — Frappe handles transactions

# ❌ Blocking request with heavy work
@frappe.whitelist()
def generate_report():
    time.sleep(60)  # NEVER — use background jobs

# ❌ Hardcoded site name
frappe.get_site_path("mysite.localhost", "private")  # WRONG
frappe.get_site_path("private")  # CORRECT — uses frappe.local.site

# ❌ get_doc() in a loop (N+1 problem)
for name in names:
    doc = frappe.get_doc("Item", name)  # WRONG — one query per iteration

# ✅ Bulk fetch
docs = frappe.get_all("Item", filters={"name": ["in", names]}, fields=["*"])

# ❌ Exposing raw exceptions to client
raise Exception("Internal DB connection string: postgres://...")  # WRONG

# ✅ Safe error handling
frappe.log_error(frappe.get_traceback(), "My Operation Failed")
frappe.throw(_("Operation failed. Please contact support."))
```

---

## 16. Debugging Tips

```bash
# View scheduler logs
bench --site <site> scheduler-events

# Check background job status
bench --site <site> doctor

# Interactive console (full Frappe context)
bench --site <site> console

# Execute a function directly
bench --site <site> execute myapp.tasks.nightly_sync

# Tail error logs
tail -f logs/frappe.log
tail -f logs/worker.log

# Check MariaDB slow queries
bench --site <site> mariadb
> SHOW PROCESSLIST;
> SELECT * FROM information_schema.PROCESSLIST WHERE TIME > 5;
```

---

## References

- Frappe Docs: https://frappeframework.com/docs
- ERPNext Docs: https://docs.erpnext.com
- Frappe UI: https://ui.frappe.io
- Frappe GitHub: https://github.com/frappe/frappe
