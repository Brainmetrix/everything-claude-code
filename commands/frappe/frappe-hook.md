# Frappe Hook
Add a doc_event hook, scheduled task, JS override, or other hooks.py entry.

## Step 1: Read Current hooks.py
Read the full `hooks.py` to understand what is already registered.
Never duplicate existing entries.

## Step 2: Classify Hook Type from $ARGUMENTS
| Indicator | Hook Type | hooks.py Key |
|-----------|-----------|-------------|
| `on_submit`, `validate`, `on_cancel`, `after_insert`, `before_save` | Doc event | `doc_events` |
| `daily`, `hourly`, `weekly`, `every N hours`, `cron`, `nightly` | Scheduler | `scheduler_events` |
| `js override`, `desk button`, `custom button` | JS override | `doctype_js` |
| `list view`, `list column` | List override | `doctype_list_js` |
| `boot`, `session`, `page load` | Boot session | `boot_session` |
| `after migrate` | Post-migration | `after_migrate` |

## Step 3: Generate hooks.py Entry (minimal diff only)

**Doc event:**
```python
doc_events = {
    "<DocType>": {
        "<event>": "<app>.handlers.<module>.<function>",
    }
}
```

**Scheduler:**
```python
scheduler_events = {
    "daily": ["<app>.tasks.<module>.<function>"],          # once/day
    "hourly": ["<app>.tasks.<module>.<function>"],         # once/hour
    "cron": {
        "0 9 * * 1-5": ["<app>.tasks.<module>.<function>"],  # weekdays 9am
    }
}
```

**JS override:**
```python
doctype_js = {
    "<DocType>": "public/js/overrides/<doctype_snake>.js"
}
```

## Step 4: Generate the Handler / Task File

**Doc event handler** → `apps/<app>/<app>/handlers/<doctype_snake>.py`:
```python
import frappe
from frappe import _

def <event>(doc, method):
    """
    Triggered on <DocType>.<event>.
    doc: the document instance
    method: the event name (string)
    """
    _<business_logic>(doc)

def _<business_logic>(doc):
    # Keep handler thin — delegate to private helpers
    pass
```

**Scheduled task** → `apps/<app>/<app>/tasks/<module>.py`:
```python
import frappe

def <function>():
    frappe.set_user("Administrator")  # required in background context
    try:
        _run()
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "<Task Name> Failed")
        raise

def _run():
    pass
```

## Step 5: Output the Diff
Show ONLY the new lines added to hooks.py, not the full file.
Show the new handler/task file in full.

## Step 6: Verify Command
```bash
bench --site <site> migrate   # if hooks.py structure changed
bench --site <site> doctor    # verify scheduler picked up new task
```

## Step 7: Guardrails
Stop and ask if:
- The hook would modify ERPNext source DocType (Sales Order, Purchase Order, etc.) → confirm the override approach is via `doc_events`, not direct modification
- Scheduler frequency is `all` (every minute) → warn about performance impact, ask to confirm
- Same event already registered for the same DocType → show existing handler, ask whether to extend or replace

## Examples
```
/frappe-hook on_submit Sales Order validate credit limit and block if exceeded
/frappe-hook daily at 9am weekdays sync pending orders to logistics API
/frappe-hook validate Purchase Order require approval for amounts above 50000
/frappe-hook on_cancel Payment Entry reverse custom ledger entries
/frappe-hook js override Sales Order add custom Print button in toolbar
```
