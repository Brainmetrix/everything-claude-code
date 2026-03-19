# /frappe-patch — Create a Data Migration Patch

## Purpose
Create a safe, idempotent Frappe data migration patch for schema changes,
data transformations, or one-time setup tasks.

## Input
$ARGUMENTS = description of what data needs to be migrated or changed

## Rules for Every Patch

1. **Always idempotent** — safe to run multiple times without side effects
2. **Check before modifying** — verify column/field/record exists first
3. **Explicit commit** — always frappe.db.commit() at the end
4. **Never delete data** — archive or flag instead of hard delete
5. **Log progress** — use frappe.logger() for long-running patches
6. **Test on staging** — always include test instructions

## Patch Template
```python
# patches/v<major>_<minor>/<descriptive_name>.py
import frappe

def execute():
    """
    One-line description of what this patch does.
    Ticket/PR: #<number>
    """
    # Guard: check if already applied or preconditions not met
    if not frappe.db.has_column("DocType", "field_name"):
        return  # column doesn't exist, nothing to do
    
    # Guard: check if already migrated
    if not frappe.db.exists("DocType", {"field": "old_value"}):
        return  # already migrated
    
    # Do the work
    frappe.db.sql("""
        UPDATE `tabDocType`
        SET new_field = old_field
        WHERE new_field IS NULL OR new_field = ''
    """)
    
    frappe.db.commit()
```

## Output
1. Patch file at correct path: `myapp/patches/v<x>_<y>/<name>.py`
2. Line to add in `patches.txt`: `myapp.patches.v<x>_<y>.<name>`
3. Test command: `bench --site <site> run-patch myapp.patches.v<x>_<y>.<name>`
4. Rollback plan (how to undo if needed)

## Examples
```
/frappe-patch rename field customer_code to customer_ref in Customer doctype
/frappe-patch set default status to Active for all existing Supplier records
/frappe-patch migrate payment_method values: Cash->CASH, Card->CARD, UPI->UPI
/frappe-patch populate full_name field from first_name + last_name in Employee
/frappe-patch remove duplicate Address records keeping the most recent one
/frappe-patch add missing naming_series to 500 legacy Invoice records
```
