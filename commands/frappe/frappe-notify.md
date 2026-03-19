# Frappe Notify
Set up email notifications, desk alerts, or WhatsApp/SMS messages for DocType events.

## Step 1: Classify from $ARGUMENTS
| Type | Indicator | Implementation |
|------|-----------|---------------|
| Frappe Notification DocType | "when X happens notify Y" | No-code: create Notification record |
| Programmatic email | "send email on submit" | `frappe.sendmail()` in handler |
| Desk alert | "show alert", "bell icon" | `frappe.publish_realtime()` |
| Bulk/scheduled email | "daily digest", "weekly summary" | Background task + `frappe.sendmail()` |
| WhatsApp/SMS | "whatsapp", "sms" | Background job via integration |

## Step 2: Generate Implementation

**Frappe Notification (fixture JSON):**
```json
{
    "doctype": "Notification",
    "name": "<DocType> <Event> Alert",
    "document_type": "<DocType>",
    "event": "Submit",
    "subject": "{{ doc.name }} has been submitted",
    "recipients": [{"receiver_by_document_field": "contact_email"}],
    "message": "<p>Dear {{ doc.contact_person }},<br>{{ doc.name }} submitted.</p>",
    "enabled": 1
}
```

**Programmatic email in handler:**
```python
def on_submit(doc, method):
    frappe.enqueue(          # never block HTTP — always enqueue
        "myapp.tasks.notifications.send_submit_email",
        queue="short",
        doc_name=doc.name,
        doctype=doc.doctype,
    )
```
```python
# tasks/notifications.py
def send_submit_email(doc_name, doctype):
    frappe.set_user("Administrator")
    doc = frappe.get_doc(doctype, doc_name)
    frappe.sendmail(
        recipients=[doc.contact_email],
        subject=_("{0} Submitted: {1}").format(doctype, doc_name),
        template="<template_name>",
        args={"doc": doc},
        reference_doctype=doctype,
        reference_name=doc_name,
    )
```

**Desk real-time alert:**
```python
frappe.publish_realtime(
    event="eval_js",
    message=f"frappe.show_alert({{message: 'Order {doc.name} approved!', indicator: 'green'}})",
    user=target_user,
)
```

## Step 3: Guardrails
- Never call `frappe.sendmail()` directly in a controller — always enqueue it
- For bulk emails (>50 recipients) → use background job with batch of 50
- Notification failure must NEVER raise an exception that blocks the main transaction — wrap in try/except

## Examples
```
/frappe-notify email customer when Sales Order is submitted
/frappe-notify desk alert to Sales Manager when credit limit is exceeded on submit
/frappe-notify daily digest email to management: new orders, pending payments
/frappe-notify WhatsApp to delivery person when Delivery Note is submitted
```
