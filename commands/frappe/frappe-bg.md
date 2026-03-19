# /frappe-bg — Create or Convert to Background Job

## Purpose
Convert a blocking operation into a properly enqueued background job,
or create a new background task from scratch.

## Input
$ARGUMENTS = task description or existing function to convert

## Queue Selection Logic
- `short`   → < 5 min  — emails, notifications, simple API calls, status updates
- `default` → < 30 min — report generation, moderate syncs, reconciliation checks
- `long`    → < 1 hour — bulk imports, full ERP syncs, heavy reconciliation

## Always Generate

### The enqueue() call:
```python
from frappe.utils.background_jobs import enqueue

enqueue(
    "myapp.tasks.<module>.<function>",
    queue="default",          # short / default / long
    timeout=1800,
    is_async=True,
    job_id=f"<logical_dedup_key>_{identifier}",  # prevents duplicate jobs
    now=frappe.conf.developer_mode,              # run sync in dev
    # pass all params explicitly — no closures
    param1=value1,
    param2=value2,
)
```

### The task function:
```python
def function_name(param1, param2):
    frappe.set_user("Administrator")  # required in background context
    try:
        # ... work ...
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Task Name Failed")
        raise
```

### Realtime progress (for tasks > 1 min):
```python
frappe.publish_realtime(
    "progress",
    {"progress": [current, total], "title": "Processing..."},
    user=frappe.session.user
)
```

## Output
1. enqueue() call with placement context
2. Complete task function
3. Test command: `bench --site <site> execute myapp.tasks.<function>`
4. Queue health check: `bench --site <site> doctor`

## Examples
```
/frappe-bg sync all pending Sales Orders to Shopify every hour
/frappe-bg generate monthly GST reconciliation report and email to accounts
/frappe-bg import 10000 items from uploaded CSV file with progress bar
/frappe-bg check Razorpay payment status for all pending Payment Entries
/frappe-bg send bulk WhatsApp notifications for overdue invoices
/frappe-bg nightly sync stock levels from WMS to ERPNext
```
