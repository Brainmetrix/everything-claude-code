# Frappe Page
Create a Frappe Page in the www/ folder — public-facing or portal pages.

## Step 1: Classify Page Type from $ARGUMENTS
| Type | Indicator | Auth Required |
|------|-----------|---------------|
| Public page | "public", "no login", "anyone can view" | No |
| Portal page | "customer portal", "vendor portal", "employee" | Yes — check session.user |
| Document view | "view invoice", "track order", "show record" | Yes + `has_permission()` |
| Form/action page | "application form", "submit", "fill" | Depends |

## Step 2: Read Existing www/ Structure
1. List `apps/<app>/<app>/www/` to follow existing naming conventions
2. Read `hooks.py` for existing `website_route_rules`

## Step 3: Generate All 4 Page Files

### `www/<page-name>.py`
```python
# www/<page-name>.py
import frappe
from frappe import _

no_cache = 1   # always set for dynamic pages

def get_context(context):
    # ── Auth guard ──────────────────────────────────────────
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to continue"), frappe.PermissionError)

    # ── Input validation ────────────────────────────────────
    name = frappe.form_dict.get("name")
    if not name:
        frappe.throw(_("Document name is required"), frappe.DoesNotExistError)

    if not frappe.db.exists("<DocType>", name):
        frappe.throw(_("{0} not found").format(name), frappe.DoesNotExistError)

    # ── Permission check ────────────────────────────────────
    doc = frappe.get_doc("<DocType>", name)
    frappe.has_permission("<DocType>", doc=doc, throw=True)

    # ── Context ─────────────────────────────────────────────
    context.doc       = doc
    context.title     = f"{doc.name}"
    context.no_cache  = 1
    context.breadcrumbs = [
        {"label": _("Home"),   "url": "/"},
        {"label": _("<DocType>s"), "url": "/<page-name>"},
        {"label": doc.name,    "url": ""},
    ]
```

### `www/<page-name>.html`
```html
{% extends "templates/web.html" %}
{% block title %}{{ title }}{% endblock %}

{% block page_content %}
<div class="container my-5">
  <div class="row">
    <div class="col-md-8">

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>{{ doc.name }}</h2>
        <span class="badge badge-{% if doc.status == 'Open' %}primary
                                 {% elif doc.status == 'Closed' %}success
                                 {% else %}secondary{% endif %}">
          {{ doc.status }}
        </span>
      </div>

      <!-- Key fields -->
      <table class="table table-bordered">
        {% for label, value in [
            ("Date",     doc.<date_field>),
            ("Customer", doc.<customer_field>),
            ("Amount",   doc.grand_total | money),
        ] %}
        <tr>
          <td class="font-weight-bold w-25">{{ label }}</td>
          <td>{{ value }}</td>
        </tr>
        {% endfor %}
      </table>

      <!-- Action button (if needed) -->
      {% if doc.status == "Pending Payment" %}
      <a href="/pay?name={{ doc.name }}" class="btn btn-primary">Pay Now</a>
      {% endif %}

    </div>
  </div>
</div>
{% endblock %}
```

### `www/<page-name>.js`
```javascript
// Page-specific JS — runs after DOM is ready
frappe.ready(function() {
    // e.g. handle payment button, live status polling
});
```

### `www/<page-name>.css` (only if needed)
```css
/* Page-specific styles */
.badge-primary { background-color: #1B4F8A; }
```

## Step 4: Add Website Route Rule (if custom URL needed)
Add to `hooks.py`:
```python
website_route_rules = [
    {"from_route": "/<custom-url>/<name>", "to_route": "<page-name>"},
]
```

## Step 5: Verify
```bash
bench --site <site> migrate   # picks up new www/ page
# Visit: https://<site>/<page-name>?name=<doc_name>
```

## Step 6: Guardrails
Stop and ask if:
- Page shows financial or personal data to Guest → must have auth guard, no exceptions
- Page performs a write action (submit, pay) → must use `@frappe.whitelist()` API endpoint, not `get_context()`
- Page name conflicts with an existing Frappe route → report conflict and ask for alternative name

## Examples
```
/frappe-page customer invoice view with pay now button
/frappe-page order tracking page showing status timeline
/frappe-page vendor portal for Purchase Order acknowledgement
/frappe-page public job application form linked to Job Opening doctype
/frappe-page payment success and failure pages after Razorpay redirect
```
