# /frappe-notify — Set Up Notifications, Emails, and Alerts

## Purpose
Create email notifications, system alerts, WhatsApp/SMS triggers,
and real-time desk notifications for Frappe DocType events.

## Input
$ARGUMENTS = what event should trigger what notification to whom

## Notification Types

### 1. Frappe Email Notification (DocType-based, no code)
```
Go to: Notification → New
- Subject: Invoice {{doc.name}} is overdue
- Event: Days After (based on due_date)
- Days: 1
- Recipients: doc.contact_email, accounts@company.com
- Message: Jinja template with doc fields
```

### 2. Programmatic Email (from controller/hook)
```python
# In handler or background job
frappe.sendmail(
    recipients=["user@example.com", doc.contact_email],
    subject=_("Payment Received: {0}").format(doc.name),
    template="payment_confirmation",   # uses templates/email/<n>.html
    args={"doc": doc, "amount": doc.grand_total},
    delayed=False,      # True = queued, False = immediate
    reference_doctype=doc.doctype,
    reference_name=doc.name,
)
```

### 3. Desk Notification (real-time bell icon)
```python
frappe.publish_realtime(
    event="eval_js",
    message="frappe.show_alert({message: 'Order approved!', indicator: 'green'})",
    user=target_user
)

# Or persistent notification
notification = frappe.new_doc("Notification Log")
notification.subject = "Approval Required"
notification.for_user = approver_user
notification.type = "Alert"
notification.document_type = doc.doctype
notification.document_name = doc.name
notification.insert(ignore_permissions=True)
```

### 4. WhatsApp / SMS (via integration)
```python
# Via background job to avoid blocking
enqueue(
    "myapp.integrations.whatsapp.send_message",
    queue="short",
    phone=doc.contact_mobile,
    message=f"Your order {doc.name} has been confirmed.",
)
```

### 5. Email Template (Jinja)
```html
<!-- templates/email/payment_confirmation.html -->
<p>Dear {{ doc.customer_name }},</p>
<p>We have received your payment of <strong>{{ doc.grand_total }}</strong>
   for invoice {{ doc.name }}.</p>
<p>Thank you for your business.</p>
```

## Always Include
- Email template .html file if custom template needed
- Background job wrapper if heavy (don't block HTTP)
- Unsubscribe link note for bulk emails
- Error handling so notification failure doesn't break main flow

## Examples
```
/frappe-notify email customer when Sales Order is submitted
/frappe-notify alert accounts team on Slack when invoice is overdue by 7 days
/frappe-notify WhatsApp message to supplier when Purchase Order is placed
/frappe-notify desk notification to Sales Manager when credit limit is exceeded
/frappe-notify daily digest email to management: new orders, pending payments, low stock
/frappe-notify SMS to delivery person when Delivery Note is submitted
```
