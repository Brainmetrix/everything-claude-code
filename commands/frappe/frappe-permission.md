# /frappe-permission — Set Up Roles and Permissions

## Purpose
Design and implement a correct permission structure for DocTypes, APIs,
and pages. Covers roles, role profiles, permission rules, and field-level
permissions.

## Input
$ARGUMENTS = what needs permission control

## Permission Layers in Frappe

### Layer 1 — DocType Permissions (in .json)
```json
"permissions": [
    {
        "role": "System Manager",
        "read": 1, "write": 1, "create": 1, "delete": 1,
        "submit": 1, "cancel": 1, "amend": 1, "report": 1,
        "import": 1, "export": 1, "print": 1, "email": 1
    },
    {
        "role": "Sales User",
        "read": 1, "write": 1, "create": 1,
        "submit": 1, "report": 1, "print": 1, "email": 1
    },
    {
        "role": "Accounts User",
        "read": 1, "report": 1
    }
]
```

### Layer 2 — User Permissions (row-level security)
```python
# Restrict a user to only see their own records
# Go to: User Permissions → New
# Allow: User → [username]
# For DocType: Customer
# Value: [customer linked to this user]
```

### Layer 3 — API Permission Check
```python
@frappe.whitelist()
def get_sensitive_data(doctype, name):
    # Always check before returning
    frappe.has_permission(doctype, doc=name, throw=True)
    # For custom logic:
    if not frappe.has_role("Sales Manager"):
        frappe.throw(_("Only Sales Managers can access this"), frappe.PermissionError)
```

### Layer 4 — Field-Level Permissions
```python
# In DocType .json, add permlevel to sensitive fields
{"fieldname": "credit_limit", "permlevel": 1}
# Then in permissions, set permlevel: 1 only for trusted roles
```

## Always Generate
1. Updated DocType .json with permission table
2. Role creation via fixture if new role needed
3. API permission checks
4. Export reminder for fixtures

## Examples
```
/frappe-permission only Sales Manager can see credit_limit field on Customer
/frappe-permission create three roles: Warehouse Staff, Warehouse Manager, Logistics Head
/frappe-permission restrict Purchase Order approval to amounts above 50000
/frappe-permission customer portal users can only see their own invoices
/frappe-permission accounts team can read but not edit submitted Sales Invoices
/frappe-permission new role HR Executive with access to leave and attendance only
```
