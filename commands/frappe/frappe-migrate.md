# Frappe Migrate
Diagnose and fix bench migrate failures, schema changes, and version upgrades.

## Step 1: Classify from $ARGUMENTS
| Indicator | Action |
|-----------|--------|
| `PatchError` / patch name | Debug failing patch |
| `OperationalError` / `Unknown column` | Schema conflict |
| `ValidationError` / DocType JSON | Fix DocType JSON |
| `upgrade` / version number | Version upgrade guide |
| `stuck` / `hanging` / `no error` | Diagnose stuck migration |
| `fresh site` | Full setup from scratch |

## Step 2: Read Relevant Files
| Error Type | Files to Read |
|-----------|---------------|
| Patch failure | The patch `.py` file from the traceback |
| DocType JSON error | The `.json` file from the traceback |
| Schema conflict | Run `DESCRIBE \`tab<DocType>\`` in MariaDB |
| Version upgrade | `apps/<app>/requirements.txt` + current Frappe version |

## Step 3: Fix Loop (one issue at a time)

### Patch Failure
```bash
# 1. Run with verbose output to see exact error
bench --site <site> run-patch <app>.patches.<path> --verbose

# 2. Read the patch file and identify the bug
# 3. Fix the bug (most common issues):
```
| Patch Error | Fix |
|-------------|-----|
| `OperationalError: Column doesn't exist` | Add `if not frappe.db.has_column(...)` guard |
| `IntegrityError: Duplicate entry` | Add `if frappe.db.exists(...)` guard |
| `AttributeError` on doc | Use `frappe.db.sql()` instead of `frappe.get_doc()` in patches |
| Already applied | Mark manually: `INSERT INTO __PatchLog VALUES ('<patch>')` |

```bash
# 4. After fixing, mark as applied and re-run full migrate
bench --site <site> console
>>> frappe.db.sql("INSERT INTO `__PatchLog` (patch) VALUES ('<app>.patches.<path>')")
>>> frappe.db.commit()
bench --site <site> migrate
```

### Schema Conflict (Unknown column)
```bash
bench --site <site> mariadb
> DESCRIBE `tab<DocType>`;   # check actual schema
> SHOW CREATE TABLE `tab<DocType>`;
```
If column missing → add field to DocType JSON → `bench migrate`
If column duplicated → `ALTER TABLE \`tab<DocType>\` DROP COLUMN <col>` → `bench migrate`

### DocType JSON Error
```bash
# Validate JSON syntax
python3 -m json.tool apps/<app>/<app>/doctype/<n>/<n>.json

# Check duplicate fieldnames
python3 -c "
import json
with open('apps/<app>/<app>/doctype/<n>/<n>.json') as f:
    doc = json.load(f)
names = [f['fieldname'] for f in doc.get('fields', [])]
dupes = set(n for n in names if names.count(n) > 1)
print('Duplicate fieldnames:', dupes)
"
```

### Version Upgrade
```bash
# 1. BACKUP FIRST — never skip
bench --site <site> backup --with-files

# 2. Check upgrade path (never skip versions)
# v13 → v14 → v15 — do NOT jump from v13 → v15

# 3. Update
bench update --pull

# 4. Migrate
bench --site <site> migrate

# 5. Rebuild
bench build --force

# 6. Restart
bench restart
```

### Stuck Migration (no output, no error)
```bash
# Check for locked DB processes
bench --site <site> mariadb
> SHOW FULL PROCESSLIST;
> SELECT * FROM information_schema.INNODB_TRX;  -- check for long transactions

# Kill blocking process if safe
> KILL <process_id>;

# Retry migrate
bench --site <site> migrate
```

## Step 4: Verify After Fix
```bash
bench --site <site> migrate   # should complete cleanly
bench --site <site> doctor    # confirm scheduler healthy
bench run-tests --app <app> --verbose  # confirm no regressions
```

## Step 5: Guardrails
Stop and ask if:
- Suggested fix involves `DROP COLUMN` or `DROP TABLE` → show data impact, require explicit confirmation
- Version upgrade skips a major version → block and explain correct upgrade path
- Patch error is in ERPNext core patches → do not modify; report as upstream issue and suggest workaround

## Recovery Strategies
| Situation | Action |
|-----------|--------|
| Migration corrupted data | Restore from backup taken in Step 1 |
| All patches failing | Check Python environment: `bench pip install -e apps/frappe` |
| Version mismatch | `bench switch-to-branch <version> --upgrade` |
| MariaDB version incompatible | Check compatibility matrix on frappeframework.com |

## Examples
```
/frappe-migrate patch myapp.patches.v2.migrate_status is failing with IntegrityError
/frappe-migrate bench migrate stuck at syncing DocTypes with no progress
/frappe-migrate upgrade ERPNext from v14 to v15
/frappe-migrate OperationalError: Unknown column custom_ref in tabCustomer
```
