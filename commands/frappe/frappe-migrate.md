# /frappe-migrate — Handle Migrations, Schema Changes, Version Upgrades

## Purpose
Diagnose and fix bench migrate failures, handle schema changes safely,
and guide ERPNext version upgrades step by step.

## Input
$ARGUMENTS = migration error, schema change needed, or upgrade target version

## Common Migration Failures & Fixes

### Patch Failure
```
Error: PatchError: Could not run patch myapp.patches.v2.some_patch
```
```bash
# Check what the patch is trying to do
cat apps/myapp/myapp/patches/v2/some_patch.py

# Run patch manually with verbose output
bench --site <site> run-patch myapp.patches.v2.some_patch --verbose

# If patch has a bug, fix it, then mark as run:
bench --site <site> console
>>> frappe.db.sql("INSERT INTO `__PatchLog` VALUES ('myapp.patches.v2.some_patch')")
>>> frappe.db.commit()
```

### Schema Conflict
```
Error: OperationalError: (1060) Duplicate column name 'custom_field'
```
```bash
# Check current schema
bench --site <site> mariadb
> DESCRIBE `tabDocType`;

# Remove duplicate column if safe
> ALTER TABLE `tabDocType` DROP COLUMN custom_field;

# Re-run migrate
bench --site <site> migrate
```

### DocType JSON Error
```
Error: ValidationError: Invalid DocType JSON for MyDocType
```
```bash
# Validate JSON syntax
python3 -m json.tool apps/myapp/myapp/doctype/my_doctype/my_doctype.json

# Check for duplicate fieldnames
python3 -c "
import json
with open('apps/myapp/myapp/doctype/my_doctype/my_doctype.json') as f:
    doc = json.load(f)
names = [f['fieldname'] for f in doc.get('fields', [])]
dupes = [n for n in names if names.count(n) > 1]
print('Duplicates:', dupes)
"
```

### ERPNext Version Upgrade Steps
```bash
# 1. Backup first — NEVER skip
bench --site <site> backup --with-files

# 2. Check upgrade path on frappeframework.com/docs
# Never skip versions (v14 → v15 → v16, not v14 → v16)

# 3. Update apps
bench update --pull

# 4. Run migrate
bench --site <site> migrate

# 5. Check for breaking changes in your custom app
# - Removed hooks? Renamed APIs? Changed DocType fields?
bench --site <site> console
>>> import myapp  # check for import errors

# 6. Rebuild assets
bench build --force

# 7. Restart
bench restart
```

## Safe Schema Change Patterns

### Adding a new field (safe, no patch needed)
- Add field to DocType JSON → bench migrate handles it

### Renaming a field (requires patch)
```python
# patches/v2_0/rename_field_x_to_y.py
def execute():
    if frappe.db.has_column("DocType", "old_field"):
        frappe.rename_field("DocType", "old_field", "new_field")
```

### Changing field type (requires careful patch + data migration)
```python
def execute():
    # 1. Add new field
    # 2. Migrate data
    # 3. Leave old field (don't delete — could break existing data)
    frappe.db.sql("UPDATE `tabDocType` SET new_field = old_field WHERE new_field IS NULL")
    frappe.db.commit()
```

## Examples
```
/frappe-migrate patch myapp.patches.v2.migrate_status is failing with IntegrityError
/frappe-migrate upgrade ERPNext from v14 to v15 safely
/frappe-migrate rename field payment_ref to payment_reference in Payment Entry custom fields
/frappe-migrate bench migrate stuck at 45% with no error
/frappe-migrate add index to tabSales Order on customer field via patch
/frappe-migrate fresh site setup from scratch with all our fixtures and patches
```
