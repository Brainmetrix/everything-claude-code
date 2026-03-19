# /frappe-hook — Add a Frappe Hook or Scheduled Task

## Purpose
Add a doc_event hook, scheduled task, JS override, or boot session hook
correctly without modifying ERPNext source.

## Input
$ARGUMENTS = what event to hook and what to do

## Hook Type Detection

### Doc Event Hook (on_submit, validate, on_cancel, after_insert, etc.)
- Add entry to `doc_events` in hooks.py
- Create handler at `myapp/handlers/<doctype_snake>.py`
- Handler receives `doc` and `method` args
- Never modify doc after on_submit without cancel/amend flow

### Scheduled Task
- Add to `scheduler_events` under correct frequency key
- Create task in `myapp/tasks.py` or `myapp/tasks/<name>.py`
- Always: `frappe.set_user("Administrator")` at top
- Always: wrap in try/except, log with `frappe.log_error()`
- Always: `frappe.db.commit()` at the end

### JS Override (doctype_js)
- Add to `doctype_js` in hooks.py
- Create at `myapp/public/js/overrides/<doctype_snake>.js`
- Use `frappe.ui.form.on()` pattern

### Boot Session Hook
- Injects data into every page load (keep lightweight)
- Add to `boot_session` in hooks.py

### Website Route Rule
- Add to `website_route_rules` for custom URL patterns

## Output Format
1. Exact hooks.py diff (only the new entry)
2. New handler/task file in full
3. Bench commands if needed
4. How to test manually

## Examples
```
/frappe-hook on_submit Sales Order validate credit limit and block if exceeded
/frappe-hook daily at 9am sync pending orders to third party logistics API
/frappe-hook validate Purchase Order require approval workflow above 50000 INR
/frappe-hook on_cancel Payment Entry reverse custom ledger entries
/frappe-hook after_insert Customer send welcome email via background job
/frappe-hook every 4 hours check Razorpay payment status for pending entries
/frappe-hook js override for Sales Order add custom Print button in toolbar
```
