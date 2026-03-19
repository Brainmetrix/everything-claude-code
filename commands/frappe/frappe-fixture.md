# Frappe Fixture
Export, import, audit, or fix fixtures for Frappe config management.

## Step 1: Classify Task from $ARGUMENTS
| Keyword | Action |
|---------|--------|
| `export` / `after adding` / `after changing` | Run export + show git commands |
| `import` / `fresh site` / `after pull` | Run import + verify |
| `missing` / `not showing` / `why` | Audit hooks.py fixtures list |
| `failing` / `error` / `conflict` | Diagnose import error |
| `what should` / `audit` | Full fixtures checklist |

## Step 2: Read Current Config
1. Read `apps/<app>/<app>/hooks.py` — find the `fixtures` list
2. Check `apps/<app>/<app>/fixtures/` — list existing fixture JSON files

## Step 3: Execute the Action

**Export:**
```bash
bench --site <site> export-fixtures --app <app>
git -C apps/<app> add <app>/fixtures/
git -C apps/<app> status   # confirm what changed
git -C apps/<app> commit -m "chore(fixtures): <describe what changed>"
```

**Import:**
```bash
bench --site <site> import-fixtures --app <app>
# Verify: check that Custom Fields appear on the target DocType
```

**Audit — verify hooks.py fixtures list includes all of:**
```python
fixtures = [
    "Custom Field",       # ← always required
    "Property Setter",    # ← always required
    "Custom Script",
    "Role",
    "Role Profile",
    {"dt": "Workflow",      "filters": [["module", "=", "<Module>"]]},
    {"dt": "Print Format",  "filters": [["module", "=", "<Module>"]]},
    {"dt": "Email Template","filters": [["module", "=", "<Module>"]]},
    {"dt": "Notification",  "filters": [["module", "=", "<Module>"]]},
]
```
Report any missing entries and add them.

**Diagnose import failure:**
| Error | Cause | Fix |
|-------|-------|-----|
| `IntegrityError: Duplicate entry` | Record already exists | Delete existing or skip |
| `LinkValidationError` | Referenced DocType missing | Import dependency first |
| `ValidationError: Missing field` | DocType schema mismatch | Run `bench migrate` first |

## Step 4: Guardrails
Stop and ask if:
- Fixtures folder is empty but hooks.py has entries → fixtures were never exported; export first
- User wants to export ALL DocTypes → warn about large file size, ask to filter by module

## Examples
```
/frappe-fixture export after adding new custom fields to Sales Order
/frappe-fixture import failing with IntegrityError on fresh site
/frappe-fixture audit what should be in fixtures for our app
/frappe-fixture add Purchase Order Approval Workflow to fixtures
```
