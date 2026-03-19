# Frappe Workflow
Create a multi-step approval workflow with states, transitions, and notifications.

## Step 1: Parse $ARGUMENTS
Extract:
- DocType to apply workflow to
- Number of approval levels
- Roles at each level
- Conditions (e.g. amount thresholds)
- What happens on rejection

If any of these are missing → ask for them before generating.

## Step 2: Read Current DocType Config
1. Read the DocType `.json` to check if `is_submittable: 1`
2. Read `hooks.py` for existing `doc_events` on this DocType
3. Check `apps/<app>/<app>/fixtures/` for any existing Workflow fixture

## Step 3: Design State Machine
Before generating code, output the state diagram as a table:

| From State | Action | To State | Allowed Role | Condition |
|-----------|--------|----------|--------------|-----------|
| Draft | Submit for Approval | Pending L1 Approval | <Submitter Role> | — |
| Pending L1 Approval | Approve | Pending L2 Approval | <L1 Role> | `doc.grand_total > 50000` |
| Pending L1 Approval | Approve | Approved | <L1 Role> | `doc.grand_total <= 50000` |
| Pending L1 Approval | Reject | Rejected | <L1 Role> | — |
| Pending L2 Approval | Final Approve | Approved | <L2 Role> | — |
| Pending L2 Approval | Reject | Rejected | <L2 Role> | — |
| Rejected | Revise and Resubmit | Draft | <Submitter Role> | — |
| Approved | — | (terminal) | — | — |

Confirm this design with the user before generating files.

## Step 4: Generate Workflow Fixture JSON
```json
{
    "doctype": "Workflow",
    "name": "<DocType> Approval",
    "document_type": "<DocType>",
    "is_active": 1,
    "send_email_alert": 1,
    "workflow_state_field": "workflow_state",
    "states": [
        {"state": "Draft",               "doc_status": "0", "allow_edit": "<Submitter Role>"},
        {"state": "Pending L1 Approval", "doc_status": "0", "allow_edit": "<L1 Role>"},
        {"state": "Approved",            "doc_status": "1", "allow_edit": ""},
        {"state": "Rejected",            "doc_status": "0", "allow_edit": "<Submitter Role>"}
    ],
    "transitions": [
        {"state": "Draft", "action": "Submit for Approval",
         "next_state": "Pending L1 Approval", "allowed": "<Submitter Role>"},
        {"state": "Pending L1 Approval", "action": "Approve",
         "next_state": "Approved", "allowed": "<L1 Role>"},
        {"state": "Pending L1 Approval", "action": "Reject",
         "next_state": "Rejected",  "allowed": "<L1 Role>"},
        {"state": "Rejected", "action": "Revise and Resubmit",
         "next_state": "Draft", "allowed": "<Submitter Role>"}
    ]
}
```

## Step 5: Generate Notification Handler
Add to `hooks.py`:
```python
doc_events = {
    "<DocType>": {
        "on_workflow_action": "myapp.handlers.workflow.on_workflow_action",
    }
}
```

Create `apps/<app>/<app>/handlers/workflow.py`:
```python
import frappe
from frappe import _
from frappe.utils.background_jobs import enqueue

def on_workflow_action(doc, method):
    """Triggered on every workflow state transition."""
    enqueue(
        "myapp.tasks.workflow_notify.send_notification",
        queue="short",
        doctype=doc.doctype,
        doc_name=doc.name,
        workflow_state=doc.workflow_state,
    )

# tasks/workflow_notify.py
def send_notification(doctype, doc_name, workflow_state):
    frappe.set_user("Administrator")
    doc = frappe.get_doc(doctype, doc_name)

    notify_map = {
        "Pending L1 Approval": ("<L1 Role>", _("{0} needs your approval").format(doc_name)),
        "Approved":            (doc.owner,   _("{0} has been approved").format(doc_name)),
        "Rejected":            (doc.owner,   _("{0} has been rejected").format(doc_name)),
    }

    target, subject = notify_map.get(workflow_state, (None, None))
    if not target:
        return

    # Resolve role to users
    if frappe.db.exists("Role", target):
        recipients = [r.parent for r in
                      frappe.get_all("Has Role", {"role": target, "parenttype": "User"},
                                     ["parent"])]
    else:
        recipients = [target]

    if recipients:
        frappe.sendmail(
            recipients=recipients,
            subject=subject,
            message=f"<p>Please review: <a href='/app/{doctype.lower().replace(' ','-')}/{doc_name}'>{doc_name}</a></p>",
            reference_doctype=doctype,
            reference_name=doc_name,
        )
```

## Step 6: Export and Register
```bash
bench --site <site> export-fixtures --app <app>
git add <app>/fixtures/
git commit -m "feat(workflow): add <DocType> approval workflow"
# Access: Desk → Workflow → <DocType> Approval
```

## Step 7: Guardrails
Stop and ask if:
- DocType is not submittable (`is_submittable: 0`) → the `Approved` state cannot set `doc_status: 1`; ask if they want to add a custom status field instead
- Same DocType already has an active Workflow → show existing workflow, ask whether to replace or extend
- More than 4 approval levels → warn about complexity, suggest consolidating into role-based conditions

## Examples
```
/frappe-workflow Purchase Order 3-level approval based on amount thresholds
/frappe-workflow Leave Application: manager approval then HR confirmation
/frappe-workflow Expense Claim: manager → finance → payment
/frappe-workflow Quotation: internal review and sign-off before sending to customer
```
