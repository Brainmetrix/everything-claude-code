# /frappe-page — Create a Frappe Page (www/ or Portal)

## Purpose
Scaffold a Frappe Page in the www/ folder — public-facing or portal pages
using Jinja templates, with Python context and page-specific JS/CSS.

## Input
$ARGUMENTS = page name and what it should display

## Page Structure Generated
```
www/
  <page-name>.html   # Jinja2 template
  <page-name>.py     # Python context (get_context)
  <page-name>.js     # Page JS
  <page-name>.css    # Page CSS (optional)
```

## Python Context Template
```python
# www/<page-name>.py
import frappe
from frappe import _

no_cache = 1          # Always set for dynamic pages

def get_context(context):
    # Auth check for protected pages
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to access this page"),
                     frappe.PermissionError)

    name = frappe.form_dict.get("name")
    if not name:
        frappe.throw(_("Document name is required"), frappe.DoesNotExistError)

    doc = frappe.get_doc("My DocType", name)
    frappe.has_permission("My DocType", doc=doc, throw=True)

    context.doc = doc
    context.title = f"{doc.name} — My Page"
    context.breadcrumbs = [
        {"label": "Home", "url": "/"},
        {"label": "My Pages", "url": "/my-pages"},
        {"label": doc.name, "url": ""},
    ]
```

## Jinja Template
```html
{% extends "templates/web.html" %}
{% block title %}{{ title }}{% endblock %}

{% block page_content %}
<div class="container my-5">
  <div class="row">
    <div class="col-md-8">
      <h2>{{ doc.name }}</h2>
      <table class="table">
        <tr><td>Customer</td><td>{{ doc.customer }}</td></tr>
        <tr><td>Amount</td><td>{{ doc.grand_total | money }}</td></tr>
        <tr><td>Status</td>
            <td><span class="badge badge-{{ doc.status | lower }}">
                {{ doc.status }}</span></td>
        </tr>
      </table>
    </div>
  </div>
</div>
{% endblock %}
```

## Website Route (add to hooks.py if custom URL needed)
```python
website_route_rules = [
    {"from_route": "/invoice/<name>", "to_route": "invoice-view"},
]
```

## Examples
```
/frappe-page customer invoice view with payment button
/frappe-page order tracking page with status timeline
/frappe-page vendor portal for PO acknowledgement and delivery confirmation
/frappe-page public job application form linked to Job Opening doctype
/frappe-page employee self-service leave application page
/frappe-page payment success/failure page after Razorpay redirect
```
