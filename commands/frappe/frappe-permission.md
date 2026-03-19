# Frappe Permission
Design and implement roles, DocType permissions, and field-level access control.

## Step 1: Classify Task from $ARGUMENTS
| Indicator | Action |
|-----------|--------|
| "only X role can see/do Y" | Modify DocType permissions + generate fixture |
| "create role" / "new role" | Generate Role fixture + Role Profile |
| "field-level" / "hide field from" | Add `permlevel` to field + role permission |
| "user permission" / "user can only see their own" | Document User Permission setup |
| "restrict" / "block" | Programmatic check in API or controller |

## Step 2: Read Current Permissions
Read the DocType `.json` file to see existing `permissions` array.
Read `apps/<app>/<app>/fixtures/` for existing Role fixtures.

## Step 3: Generate Permission Changes

**DocType permission table entry:**
```json
{
    "role": "<Role Name>",
    "read": 1, "write": 1, "create": 1, "delete": 0,
    "submit": 0, "cancel": 0, "amend": 0,
    "report": 1, "import": 0, "export": 1,
    "print": 1, "email": 1,
    "permlevel": 0
}
```

**Field-level permission (permlevel):**
```json
{"fieldname": "credit_limit", "permlevel": 1, ...}
```
Add a matching permission row with `"permlevel": 1` for trusted roles only.

**Programmatic role check in API:**
```python
if not frappe.has_role("Sales Manager"):
    frappe.throw(_("Only Sales Managers can access this"), frappe.PermissionError)
```

**Programmatic permission check in controller:**
```python
def validate(self):
    if self.grand_total > 50000 and not frappe.has_role("Accounts Manager"):
        frappe.throw(_("Amounts above 50,000 require Accounts Manager approval"))
```

## Step 4: Export Fixtures
```bash
bench --site <site> export-fixtures --app <app>
git add <app>/fixtures/
git commit -m "feat(permission): <describe the access change>"
```

## Step 5: Guardrails
- Never remove System Manager permissions — only restrict other roles
- User Permissions (row-level) must be set in Desk UI, cannot be scripted via fixture
- Field permlevel > 0 is invisible in the form unless the role explicitly has that permlevel

## Examples
```
/frappe-permission only Sales Manager can see credit_limit field on Customer
/frappe-permission create three roles: Warehouse Staff, Warehouse Manager, Logistics Head
/frappe-permission accounts team can read but not edit submitted Sales Invoices
/frappe-permission customer portal users can only see their own invoices
```
