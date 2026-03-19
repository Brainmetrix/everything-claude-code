# Frappe Fix
Diagnose and fix errors in Frappe/ERPNext apps incrementally and safely.

## Step 1: Classify the Error from $ARGUMENTS
| Error Pattern | Type | Where to Look |
|---------------|------|---------------|
| `Traceback (most recent call last)` | Python exception | File + line in traceback |
| `frappe.exceptions.ValidationError` | Business logic | Controller validate() |
| `frappe.exceptions.PermissionError` | Auth issue | has_permission() / roles |
| `OperationalError: 1054 Unknown column` | Missing migration | Run bench migrate |
| `OperationalError: 1062 Duplicate entry` | Uniqueness violation | Check naming_series / unique field |
| `ImportError` / `ModuleNotFoundError` | Bad import path | Check file exists + __init__.py |
| `AttributeError: 'NoneType'` | None not checked | frappe.get_value() returned None |
| RQ job silently fails | Worker context | Missing frappe.set_user() |
| JS console error | Client script | Browser DevTools + client script file |
| `bench build` fails | Asset build | Node version / missing npm deps |
| `bench migrate` fails | Patch/schema | Patch file or DocType JSON |

## Step 2: Read the Error Context
1. Read the **exact file and line number** from the traceback
2. Read 15 lines around the error for context
3. If RQ job: read `logs/worker.log` (last 100 lines)
4. If JS error: read the client script file for that DocType

## Step 3: Diagnose Root Cause
State the root cause in ONE sentence before writing any fix.
Common Frappe root causes:
| Symptom | Root Cause |
|---------|-----------|
| `'NoneType' has no attribute 'X'` | `frappe.get_value()` returned None — no existence check |
| `Document has been modified after you opened it` | Concurrent save — use `frappe.db.set_value()` for atomic updates |
| `frappe.db.commit() not allowed` | `commit()` called inside `validate()` — move to `after_insert` |
| `No module named 'myapp.xyz'` | Wrong import path or missing file — verify path |
| `OperationalError: Unknown column` | Field added to DocType JSON but `bench migrate` not run |
| `PermissionError` in API | `frappe.has_permission()` missing or role not assigned |
| `Job exceeded timeout` | Task in wrong queue — move to `long` queue |
| Scheduled task not running | `bench --site <site> doctor` → check scheduler status |

## Step 4: Fix Loop (one issue at a time)
For each error found:
1. **Show minimal diff** — smallest change that resolves the issue
2. **Re-run verification** — show exact command to confirm fix
3. **Move to next** — only proceed after previous error is resolved

Fix template:
```python
# BEFORE (the problem)
<original code>

# AFTER (the fix)
<fixed code>
```

## Step 5: Verify Fix
```bash
# Python error → re-run the operation that triggered it
bench --site <site> console
>>> <reproduce the operation>

# Migration error → re-run migration
bench --site <site> migrate --verbose

# Test failure → run specific test
bench run-tests --app <app> --doctype "<DocType>" --verbose

# RQ job → re-enqueue and watch logs
tail -f logs/worker.log
```

## Step 6: Guardrails
Stop and ask if:
- The same error persists after 2 fix attempts → likely a deeper issue, explain and ask for more context
- The fix requires modifying ERPNext source → stop, show the correct override approach
- The fix introduces a new error → report immediately, do not continue fixing
- `bench migrate` is suggested → verify it's actually needed (missing column) before recommending

## Step 7: Summary
After fixing, show:
- Root cause (one sentence)
- What was changed (file + line)
- How to verify it's fixed
- Why it happened (one sentence to prevent recurrence)

## Recovery Strategies
| Situation | Action |
|-----------|--------|
| None check missing | Add `if not value: frappe.throw(...)` before access |
| Wrong import path | `find apps/<app> -name "*.py" \| grep <module>` |
| Missing migration | `bench --site <site> migrate` |
| RQ job context | Add `frappe.set_user("Administrator")` as first line |
| Scheduler not running | `bench --site <site> doctor` → restart if needed |
| Patch failing | Run patch manually with `--verbose`, fix, mark as run |

## Examples
```
/frappe-fix TypeError: 'NoneType' object has no attribute 'customer' in payment handler
/frappe-fix Sales Order submit failing with ValidationError but field exists in form
/frappe-fix bench migrate failing on patch myapp.patches.v2.migrate_invoice_status
/frappe-fix RQ background job silently failing with no error in frappe.log
```
