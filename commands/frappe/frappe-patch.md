# Frappe Patch
Create a safe, idempotent data migration patch.

## Step 1: Parse $ARGUMENTS
Extract:
- What data needs to change (rename, set default, transform values)
- Which DocType / table is affected
- Target version for the patch path (check existing `patches/` for latest version)

Read `apps/<app>/patches.txt` and `apps/<app>/<app>/patches/` to determine the correct version folder.

## Step 2: Determine Patch Type
| Type | Indicator | Guard Pattern |
|------|-----------|---------------|
| Rename field | "rename field X to Y" | `frappe.db.has_column()` |
| Set default value | "set default", "populate empty" | Check column exists + filter on NULL |
| Transform values | "migrate", "convert", "replace value" | Check old values exist before changing |
| Add index | "add index", "slow query on field X" | `frappe.db.has_index()` |
| One-time setup | "create default records", "initial data" | `frappe.db.exists()` |

## Step 3: Generate Patch File
Path: `apps/<app>/<app>/patches/v<major>_<minor>/<descriptive_name>.py`

```python
# <app>/patches/v<X>_<Y>/<descriptive_name>.py
import frappe


def execute():
    """
    <One-sentence description of what this patch does>.
    Safe to run multiple times (idempotent).
    """
    # Guard 1: check precondition exists
    if not frappe.db.has_column("<DocType>", "<field>"):
        return  # nothing to do

    # Guard 2: check work is not already done
    if not frappe.db.exists("<DocType>", {"<old_field_value>": "<old_value>"}):
        return  # already migrated

    # Do the work with parametrized SQL
    frappe.db.sql("""
        UPDATE `tab<DocType>`
        SET `<target_field>` = %(new_value)s
        WHERE `<condition_field>` = %(condition_value)s
          AND (`<target_field>` IS NULL OR `<target_field>` = '')
    """, {
        "new_value": "<value>",
        "condition_value": "<value>",
    })

    frappe.db.commit()
```

## Step 4: Register in patches.txt
Add ONE line at the end of `apps/<app>/patches.txt`:
```
<app>.patches.v<X>_<Y>.<descriptive_name>
```

## Step 5: Provide Test Commands
```bash
# Test on staging first — ALWAYS
bench --site <staging_site> run-patch <app>.patches.v<X>_<Y>.<descriptive_name>

# Verify result
bench --site <staging_site> console
>>> frappe.db.sql("SELECT COUNT(*) FROM `tab<DocType>` WHERE <verify_condition>")

# Run on production only after staging passes
bench --site <prod_site> run-patch <app>.patches.v<X>_<Y>.<descriptive_name>
```

## Step 6: Guardrails
Stop and ask if:
- The patch deletes data → never delete, archive or flag instead; ask for confirmation
- No guard clause would be idempotent → redesign the guard before proceeding
- The patch modifies ERPNext core tables (`tabSales Order`, `tabCustomer`, etc.) → confirm this is intentional and safe
- Patch touches > 10,000 rows → recommend batching with commit every 500 rows

## Patch Rules (always apply)
- Every patch MUST have at least one guard clause (return early if already done)
- Never use string interpolation in SQL — always use `%(key)s` with dict
- Always `frappe.db.commit()` at the end
- Never `frappe.get_doc()` in a loop — use `frappe.db.sql()` for bulk updates
- Never delete rows — set a `disabled` or `archived` flag instead

## Examples
```
/frappe-patch rename field customer_code to customer_ref in Customer doctype
/frappe-patch set default status to Active for all existing Supplier records where status is blank
/frappe-patch migrate payment_method values: Cash to CASH, Card to CARD
/frappe-patch add database index on customer field in tabSales Order for performance
/frappe-patch populate full_name from first_name + last_name in Employee
```
