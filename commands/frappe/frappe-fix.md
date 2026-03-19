# /frappe-fix — Debug and Fix Frappe Errors

## Purpose
Diagnose and fix errors in Frappe/ERPNext apps with full context awareness.
Works with Python tracebacks, JS console errors, bench build failures,
migration errors, and RQ job failures.

## Input
$ARGUMENTS = error message, traceback, or description of the problem

## Diagnostic Process

### Step 1 — Classify the error type
- **Python traceback** → read the file + line number immediately
- **frappe.ValidationError** → look for missing validate() logic
- **frappe.PermissionError** → check has_permission() and role setup
- **IntegrityError / DB error** → check for missing migration, wrong field type
- **ImportError / AttributeError** → check for typos, missing __init__.py
- **RQ job failure** → check worker.log, look for missing frappe.set_user()
- **JS console error** → check browser console + client script logic
- **bench build failure** → check node/npm versions, missing dependencies
- **bench migrate failure** → look for patch errors or schema conflicts

### Step 2 — Read relevant files
Before suggesting any fix, read:
- The exact file and line number from the traceback
- The DocType controller if error is in a lifecycle hook
- hooks.py if error is in a doc_event handler
- The test file if tests are failing

### Step 3 — Diagnose root cause
State the root cause in one sentence before showing any fix.

### Step 4 — Fix
- Show minimal diff — only what changes
- Never suggest restarting bench as a fix unless it's clearly a process issue
- Never suggest clearing cache as a primary fix
- If the fix requires a migration, show the patch file

## Output Format
1. **Root cause** (one sentence)
2. **Fix** (minimal code diff)
3. **How to verify** (exact bench command to confirm it's fixed)
4. **Why this happened** (one sentence to prevent recurrence)

## Common Frappe Error Patterns Known

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `'NoneType' has no attribute 'name'` | frappe.get_value() returned None | Add None check before accessing |
| `Document has been modified after you have opened it` | Concurrent save conflict | Use frappe.db.set_value() for atomic updates |
| `frappe.db.commit() not allowed` | commit() inside validate | Move commit to after_insert/on_submit |
| `No module named 'myapp.xyz'` | Missing file or wrong import path | Check file exists, check __init__.py |
| `OperationalError: (1054) Unknown column` | Missing bench migrate | Run bench migrate |
| `PermissionError: No permission for Sales Order` | Missing has_permission check | Add frappe.has_permission() |
| `Job exceeded maximum timeout` | Heavy task in short queue | Move to long queue, increase timeout |

## Examples
```
/frappe-fix TypeError: 'NoneType' object has no attribute 'customer' in payment handler
/frappe-fix Sales Order submission failing with ValidationError: Credit limit exceeded but field doesn't exist
/frappe-fix bench migrate failing on patch myapp.patches.v2.migrate_invoice_status
/frappe-fix RQ background job silently failing — no error in logs
/frappe-fix frappe.ui.form.on refresh not firing on custom DocType
/frappe-fix OperationalError on tabCustomer after adding custom field
```
