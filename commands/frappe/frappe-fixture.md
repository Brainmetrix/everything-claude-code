# /frappe-fixture — Manage Frappe Fixtures

## Purpose
Export, import, audit, or troubleshoot Frappe fixtures (Custom Fields,
Roles, Workflows, Print Formats, Property Setters, etc.)

## Input
$ARGUMENTS = what you want to do with fixtures

## Operations

### Export (most common)
```bash
# Export all fixtures defined in hooks.py
bench --site <site> export-fixtures --app <app>

# Export specific DocType fixtures
bench --site <site> export-fixtures --app <app> --doctype "Custom Field"

# After export, always commit
git add <app>/fixtures/
git commit -m "chore(fixtures): export <what changed>"
```

### Import (fresh site / after git pull)
```bash
bench --site <site> import-fixtures --app <app>
```

### Audit — What Should Be in Fixtures?
Always fixture these (check hooks.py `fixtures` list):
- Custom Field
- Custom Script
- Property Setter
- Role
- Role Profile
- Workflow (app-specific ones)
- Print Format (custom ones)
- Email Template
- Letter Head
- Notification (custom)

### Common Fixture Issues Diagnosed
| Problem | Cause | Fix |
|---------|-------|-----|
| Custom field missing on fresh site | Not in fixtures list | Add to fixtures in hooks.py, export |
| Fixture import fails with conflict | Duplicate name | Check for existing record, delete or rename |
| Workflow not working after import | Missing Role in fixture | Add Role to fixtures list |
| Print Format blank after import | Missing Letter Head fixture | Add Letter Head to fixtures |

### Verify hooks.py fixtures config:
```python
fixtures = [
    "Custom Field",
    "Property Setter",
    "Custom Script",
    "Role",
    {"dt": "Workflow", "filters": [["module", "=", "My Module"]]},
    {"dt": "Print Format", "filters": [["module", "=", "My Module"]]},
]
```

## Output
1. Commands to run
2. Updated hooks.py fixtures list if needed
3. Git commands to commit

## Examples
```
/frappe-fixture export after adding new custom fields to Sales Order
/frappe-fixture why is my custom field missing on the staging server
/frappe-fixture add Workflow for Purchase Order approval to fixtures
/frappe-fixture full audit of what should be in fixtures for our app
/frappe-fixture import failing with IntegrityError on fresh site
```
