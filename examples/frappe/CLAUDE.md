# Frappe / ERPNext Project — Claude Code Context

## Project Overview

This is a **Frappe Framework** project combining:
- **ERPNext customization** (custom fields, custom scripts, overrides)
- **Custom Frappe app(s)** built from scratch on the Frappe framework
- **MariaDB** as the primary database
- **Python** backend (Frappe controllers, APIs, background jobs)
- **Multiple frontends**: Frappe UI (Vue 3), Jinja templates, React/Next.js, Frappe Pages, traditional HTML/CSS/JS

---

## Repository Structure

```
apps/
  frappe/                   # Core framework (do NOT modify directly)
  erpnext/                  # ERPNext (avoid direct edits — use customizations)
  <custom_app>/             # Our custom Frappe app
    <custom_app>/
      doctype/              # DocType definitions + controllers
        <doctype_name>/
          <doctype_name>.json      # DocType schema
          <doctype_name>.py        # Server-side controller
          <doctype_name>.js        # Client-side script
          test_<doctype_name>.py   # Unit tests
      api/                  # Whitelisted API endpoints
      hooks.py              # App hooks (event bindings, scheduled tasks)
      patches/              # Data migration patches
      fixtures/             # Exportable config (roles, custom fields, etc.)
      public/
        js/                 # Global JS (desk)
        css/                # Global CSS
      templates/            # Jinja2 HTML templates
      www/                  # Frappe Pages (publicly accessible)
      utils/                # Shared Python utilities
    frontend/               # Frappe UI (Vue 3) app — if separate
    react-app/              # React/Next.js frontend — if present
```

---

## Key CLI Commands

```bash
# Development server
bench start                          # Start all services

# App management
bench new-app <app_name>             # Create new app
bench install-app <app_name>         # Install app to site
bench uninstall-app <app_name>       # Uninstall app

# Database
bench migrate                        # Run pending patches + sync DocTypes
bench --site <site> migrate          # Site-specific migration
bench --site <site> mariadb          # Open MariaDB console
bench --site <site> backup           # Backup database

# Build
bench build                          # Build all frontend assets
bench build --app <app_name>         # Build specific app assets
bench build --force                  # Force rebuild

# Testing
bench run-tests --app <app_name>                    # Run all app tests
bench run-tests --app <app_name> --doctype <name>   # Test specific DocType
bench run-tests --app <app_name> --module <module>  # Test specific module
bench run-ui-tests <app_name>                       # Run Cypress UI tests

# Fixtures & Config
bench --site <site> export-fixtures --app <app_name>   # Export fixtures
bench --site <site> import-fixtures --app <app_name>   # Import fixtures

# Scheduler / Background Jobs
bench --site <site> run-scheduled-tasks              # Run scheduled tasks manually
bench --site <site> doctor                           # Check scheduler health

# Patches
bench --site <site> run-patch <patch_path>           # Run a specific patch

# Shell
bench --site <site> console                          # Frappe Python REPL
bench execute <method>                               # Execute a whitelisted method
```

---

## Frappe Framework Conventions

### DocType Controllers (Python)

```python
import frappe
from frappe.model.document import Document

class MyDocType(Document):
    def validate(self):
        """Called before save (insert + update)."""
        self.validate_custom_logic()

    def before_insert(self):
        """Called before a new record is inserted."""
        pass

    def after_insert(self):
        """Called after a new record is inserted."""
        pass

    def on_submit(self):
        """Called when document is submitted (amend flow)."""
        pass

    def on_cancel(self):
        """Called when document is cancelled."""
        pass

    def on_trash(self):
        """Called before deletion."""
        pass

    def validate_custom_logic(self):
        if not self.some_required_field:
            frappe.throw(_("Some Required Field is mandatory"))
```

### Whitelisted API Endpoints

```python
# api/my_api.py
import frappe

@frappe.whitelist()
def get_data(param1, param2=None):
    """Callable from frontend or REST clients."""
    frappe.has_permission("My DocType", throw=True)
    return frappe.get_list("My DocType", filters={"param": param1})

@frappe.whitelist(allow_guest=True)
def public_endpoint():
    """Accessible without login."""
    return {"status": "ok"}
```

REST call pattern: `POST /api/method/<app>.<module>.api.<file>.<function>`

### hooks.py Patterns

```python
# Scheduled tasks
scheduler_events = {
    "daily": ["myapp.tasks.daily_sync"],
    "hourly": ["myapp.tasks.hourly_cleanup"],
    "cron": {
        "0 9 * * 1-5": ["myapp.tasks.weekday_morning_job"]
    }
}

# DocType event hooks (override without modifying ERPNext)
doc_events = {
    "Sales Order": {
        "on_submit": "myapp.hooks_handlers.sales_order.on_submit",
        "on_cancel": "myapp.hooks_handlers.sales_order.on_cancel",
    },
    "*": {
        "on_trash": "myapp.hooks_handlers.common.on_trash",
    }
}

# Override standard Frappe/ERPNext JS
doctype_js = {
    "Sales Order": "public/js/overrides/sales_order.js"
}

# Jinja globals
jinja = {
    "methods": ["myapp.utils.jinja_helpers.get_formatted_value"],
}

# Website routes
website_route_rules = [
    {"from_route": "/my-page/<name>", "to_route": "my-page"},
]
```

### Background Jobs (Redis Queue / RQ)

```python
import frappe
from frappe.utils.background_jobs import enqueue

# Enqueue a job
enqueue(
    "myapp.tasks.heavy_task",
    queue="long",           # "default", "short", "long"
    timeout=3600,
    job_id="unique_job_id", # Prevents duplicate jobs
    param1="value1",
)

# The task function
def heavy_task(param1):
    frappe.set_user("Administrator")  # Set user context in background
    # ... do work ...
    frappe.db.commit()
```

### MariaDB / Frappe ORM Patterns

```python
# Preferred: Frappe ORM (safe, permission-aware)
doc = frappe.get_doc("Sales Order", "SO-00001")
frappe.get_list("Item", filters={"item_group": "Products"}, fields=["name", "item_name"])
frappe.get_value("Customer", {"name": customer_name}, "customer_group")
frappe.db.set_value("Sales Order", name, "status", "Closed")

# Direct SQL (use sparingly, only when ORM is insufficient)
frappe.db.sql("""
    SELECT so.name, soi.item_code
    FROM `tabSales Order` so
    JOIN `tabSales Order Item` soi ON soi.parent = so.name
    WHERE so.docstatus = 1
    AND so.transaction_date >= %(from_date)s
""", {"from_date": from_date}, as_dict=True)

# Always use parametrized queries — NEVER string interpolation
# WRONG:  frappe.db.sql(f"SELECT * FROM `tab{doctype}` WHERE name = '{name}'")
# RIGHT:  frappe.db.sql("SELECT * FROM `tabSales Order` WHERE name = %(name)s", {"name": name})

# MariaDB table naming convention
# All Frappe DocType tables are prefixed with `tab`
# "Sales Order" → `tabSales Order`
# "Sales Order Item" (child) → `tabSales Order Item`
```

---

## Frontend Architecture

### Frappe UI (Vue 3)
- Located in `frontend/` or `<app>/public/js/`
- Uses `frappe-ui` component library
- API calls via `frappe.call()` or `createResource()`
- Build with `bench build --app <app_name>`

```javascript
// Frappe UI resource pattern
import { createResource } from 'frappe-ui'

const myData = createResource({
  url: 'myapp.api.get_data',
  params: { param1: 'value' },
  auto: true,
})
```

### Client Scripts (Desk — Standard JS)

```javascript
// doctype/<name>/<name>.js
frappe.ui.form.on('My DocType', {
    refresh(frm) {
        frm.add_custom_button(__('Custom Action'), () => {
            frappe.call({
                method: 'myapp.api.my_function',
                args: { name: frm.doc.name },
                callback(r) {
                    if (r.message) frappe.msgprint(r.message)
                }
            })
        })
    },

    field_name(frm) {
        // Triggered when field_name changes
    }
})
```

### Jinja Templates

```html
<!-- templates/pages/my_page.html -->
{% extends "templates/web.html" %}
{% block page_content %}
<div class="container">
    <h1>{{ title }}</h1>
    {{ get_formatted_value(doc.amount) }}
</div>
{% endblock %}
```

### Frappe Pages (www/)

```
www/
  my-page.html      # Page template
  my-page.py        # Page context (get_context function)
  my-page.js        # Page-specific JS
  my-page.css       # Page-specific CSS
```

```python
# www/my-page.py
def get_context(context):
    context.title = "My Page"
    context.doc = frappe.get_doc("My DocType", frappe.form_dict.name)
```

---

## REST API & Webhook Patterns

### Incoming Webhooks

```python
@frappe.whitelist(allow_guest=True)
def webhook_handler():
    """Handle incoming webhooks from third-party services."""
    payload = frappe.request.get_json()
    # Validate signature/token
    validate_webhook_signature(frappe.request.headers)
    # Process asynchronously
    enqueue("myapp.integrations.process_webhook", payload=payload, queue="default")
    return {"status": "received"}
```

### Outgoing REST Integrations

```python
import requests
from frappe.integrations.utils import make_request

def call_third_party_api(endpoint, data):
    settings = frappe.get_single("My Integration Settings")
    response = requests.post(
        f"{settings.base_url}/{endpoint}",
        json=data,
        headers={
            "Authorization": f"Bearer {settings.get_password('api_key')}",
            "Content-Type": "application/json"
        },
        timeout=30
    )
    response.raise_for_status()
    return response.json()
```

---

## ERPNext Customization Rules

> **Never modify ERPNext or Frappe core files directly.**
> All customizations must live in our custom app.

| Need | Approach |
|---|---|
| Add fields to ERPNext DocType | Custom Fields via fixtures or UI |
| Override controller behavior | `doc_events` in hooks.py |
| Override JS | `doctype_js` in hooks.py |
| Extend API | New whitelisted method in custom app |
| Change print format | Custom Print Format (not override) |
| Add report | Custom Report in custom app |

---

## Payment Gateway Patterns

```python
# integrations/payment_gateway.py
import frappe
from frappe import _

class PaymentGateway:
    def initiate_payment(self, amount, currency, reference):
        """Initiate payment and return redirect URL."""
        pass

    def verify_payment(self, transaction_id):
        """Verify payment status from gateway."""
        pass

    def handle_callback(self, payload):
        """Handle payment gateway callback/webhook."""
        # Always verify signature first
        # Log the raw payload before processing
        # Update Payment Entry in ERPNext
        pass
```

---

## Testing Conventions

```python
# test_my_doctype.py
import frappe
import unittest
from frappe.test_runner import make_test_records

class TestMyDocType(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        make_test_records("My DocType")

    def test_validation(self):
        doc = frappe.new_doc("My DocType")
        doc.field_name = "value"
        doc.insert()
        self.assertEqual(doc.status, "Draft")

    def test_api_endpoint(self):
        frappe.set_user("Administrator")
        result = frappe.call("myapp.api.get_data", param1="test")
        self.assertIsNotNone(result)

    def tearDown(self):
        frappe.db.rollback()
```

Run tests:
```bash
bench run-tests --app <app_name> --verbose
```

---

## Security Rules (Always Follow)

1. **Always use `frappe.has_permission()`** before returning sensitive data in APIs
2. **Never use string interpolation** in SQL — always parametrized queries
3. **Store secrets in `*Settings` DocTypes** using Password field type — never in code
4. **Validate webhook signatures** before processing incoming payloads
5. **Use `@frappe.whitelist()`** only on functions that should be publicly callable
6. **Never expose `allow_guest=True`** without explicit rate limiting or signature check
7. **Sanitize user input** with `frappe.utils.escape_html()` in templates

---

## Performance Guidelines

- Prefer `frappe.get_list()` over `frappe.db.sql()` for simple queries
- Use `frappe.get_cached_doc()` for frequently accessed single/settings documents
- Enqueue heavy operations to background jobs — never block HTTP requests
- Use `frappe.cache().get_value()` / `set_value()` for expensive computed values
- Add DB indexes for frequently filtered fields via Custom Fields or patches
- Limit `frappe.get_list()` with `page_length` — default is 20, max carefully

---

## Git Workflow

```bash
# Feature branches
git checkout -b feat/add-payment-reconciliation

# Commit format
git commit -m "feat(payment): add razorpay webhook signature verification"
git commit -m "fix(sales-order): validate customer credit limit on submit"
git commit -m "chore(fixtures): export updated custom fields"

# Always export fixtures before committing config changes
bench --site <site> export-fixtures --app <app_name>
git add <app_name>/fixtures/
```

---

## Common Pitfalls

| Pitfall | Correct Approach |
|---|---|
| `frappe.db.commit()` in validate | Never commit in validate — Frappe handles transactions |
| Modifying ERPNext source | Use hooks, custom fields, and overrides only |
| Blocking REST API with heavy work | Always enqueue to background job |
| Hardcoding site name | Use `frappe.local.site` |
| Direct table name without backticks | Always use backticks: `` `tabSales Order` `` |
| Using `frappe.get_doc()` in a loop | Use `frappe.get_list()` with bulk fetch instead |
| Missing `frappe.db.rollback()` in tests | Always rollback in `tearDown()` |

---

## MCP / Integration Checklist

When adding a new third-party integration:
- [ ] Create a `*Settings` DocType with encrypted credential fields
- [ ] Add connection test button in Settings form
- [ ] Log all outgoing requests and responses
- [ ] Handle rate limits with exponential backoff
- [ ] Write unit tests with mocked HTTP calls
- [ ] Add webhook handler with signature verification
- [ ] Document the integration in `/docs`
