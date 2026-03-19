# /frappe-workflow — Create Approval Workflows

## Purpose
Design and implement multi-step approval workflows for Frappe DocTypes
with states, transitions, roles, email notifications, and escalations.

## Input
$ARGUMENTS = DocType name and approval flow description

## Workflow Components

### 1. Workflow Definition (JSON for fixture)
```json
{
    "doctype": "Workflow",
    "name": "Purchase Order Approval",
    "document_type": "Purchase Order",
    "is_active": 1,
    "send_email_alert": 1,
    "states": [
        {
            "state": "Draft",
            "doc_status": "0",
            "allow_edit": "Purchase User"
        },
        {
            "state": "Pending Manager Approval",
            "doc_status": "0",
            "allow_edit": "Purchase Manager"
        },
        {
            "state": "Pending Finance Approval",
            "doc_status": "0",
            "allow_edit": "Accounts Manager"
        },
        {
            "state": "Approved",
            "doc_status": "1",
            "allow_edit": ""
        },
        {
            "state": "Rejected",
            "doc_status": "0",
            "allow_edit": "Purchase User"
        }
    ],
    "transitions": [
        {
            "state": "Draft",
            "action": "Submit for Approval",
            "next_state": "Pending Manager Approval",
            "allowed": "Purchase User",
            "allow_self_approval": 0
        },
        {
            "state": "Pending Manager Approval",
            "action": "Approve",
            "next_state": "Pending Finance Approval",
            "allowed": "Purchase Manager",
            "condition": "doc.grand_total > 50000"
        },
        {
            "state": "Pending Manager Approval",
            "action": "Approve",
            "next_state": "Approved",
            "allowed": "Purchase Manager",
            "condition": "doc.grand_total <= 50000"
        },
        {
            "state": "Pending Manager Approval",
            "action": "Reject",
            "next_state": "Rejected",
            "allowed": "Purchase Manager"
        },
        {
            "state": "Pending Finance Approval",
            "action": "Final Approve",
            "next_state": "Approved",
            "allowed": "Accounts Manager"
        },
        {
            "state": "Rejected",
            "action": "Revise and Resubmit",
            "next_state": "Draft",
            "allowed": "Purchase User"
        }
    ]
}
```

### 2. Workflow Notifications (hook)
```python
# handlers/workflow.py
def on_workflow_action(doc, method):
    """Triggered on every workflow state change."""
    if doc.workflow_state == "Pending Manager Approval":
        notify_approvers(doc, role="Purchase Manager",
                        subject=f"PO {doc.name} needs your approval")
    elif doc.workflow_state == "Approved":
        notify_requester(doc, message="Your PO has been approved")
    elif doc.workflow_state == "Rejected":
        notify_requester(doc, message="Your PO has been rejected")

def notify_approvers(doc, role, subject):
    approvers = frappe.get_all("Has Role",
        filters={"role": role, "parenttype": "User"},
        fields=["parent as user"])
    recipients = [a.user for a in approvers if a.user != "Administrator"]
    if recipients:
        frappe.sendmail(recipients=recipients, subject=subject,
                       message=f"Please review: {doc.name}")
```

### 3. Escalation (scheduled task)
```python
# tasks/workflow_escalation.py
def escalate_pending_approvals():
    """Run daily — escalate if pending > 2 days."""
    pending = frappe.get_all("Purchase Order",
        filters={"workflow_state": "Pending Manager Approval",
                 "modified": ["<", frappe.utils.add_days(frappe.utils.today(), -2)]})
    for po in pending:
        notify_escalation(po.name)
```

## Output
1. Workflow JSON (ready for fixtures)
2. hooks.py doc_event entry for on_workflow_action
3. Notification handler
4. Escalation task (if needed)
5. Export command: `bench --site <site> export-fixtures --app <app>`

## Examples
```
/frappe-workflow Purchase Order: 3-level approval based on amount (<50k, 50k-200k, >200k)
/frappe-workflow Leave Application: manager approval then HR confirmation
/frappe-workflow Sales Invoice: accounts review before submission
/frappe-workflow Expense Claim: manager → finance → payment
/frappe-workflow Customer Onboarding: sales → KYC → credit check → activation
/frappe-workflow Quotation: internal review before sending to customer
```
