# Frappe Background Job
Convert a blocking operation to a background job or create a new one from scratch.

## Step 1: Determine Mode from $ARGUMENTS
| Mode | Indicator |
|------|-----------|
| Convert existing | File path or function name mentioned |
| Create new | Task described without existing code reference |

If converting: Read the target file first before generating anything.

## Step 2: Select Queue
| Queue | Timeout | Use For |
|-------|---------|---------|
| `short` | 5 min | Emails, notifications, simple API calls, status updates |
| `default` | 30 min | Report generation, moderate syncs, reconciliation checks |
| `long` | 1 hour | Bulk imports, full ERP syncs, heavy reconciliation |

If timeout is unclear, ask: "Expected runtime: under 5 min, 5-30 min, or over 30 min?"

## Step 3: Generate the enqueue() Call
Place this in the API endpoint or controller that currently does the blocking work:
```python
from frappe.utils.background_jobs import enqueue

enqueue(
    "<app>.tasks.<module>.<function_name>",
    queue="<short|default|long>",
    timeout=<300|1800|3600>,
    is_async=True,
    job_id=f"<logical_name>_{<unique_identifier>}",  # deduplication key
    now=frappe.conf.developer_mode,  # run sync in dev, async in prod
    # pass ALL params explicitly — no closures, no frappe.local references
    <param1>=value1,
    <param2>=value2,
)
```

## Step 4: Generate the Task Function
Place in `apps/<app>/<app>/tasks/<module>.py`:
```python
import frappe

def <function_name>(<param1>, <param2>):
    """
    <One-line description>.
    Queue: <queue>, Timeout: <timeout>s
    """
    frappe.set_user("Administrator")  # always required in background context
    try:
        total = _get_total(<param1>)
        for i, item in enumerate(_get_items(<param1>)):
            _process_item(item, <param2>)

            # Progress update every 50 items (for tasks > 1 min)
            if i % 50 == 0:
                frappe.publish_realtime(
                    "progress",
                    {"progress": [i, total], "title": "Processing..."},
                    user=frappe.session.user,
                )

            # Batch commit every 500 items (never commit inside inner loop)
            if i % 500 == 0:
                frappe.db.commit()

        frappe.db.commit()  # final commit

    except Exception:
        frappe.log_error(frappe.get_traceback(), "<Function Name> Failed")
        raise  # re-raise so RQ marks job as failed

def _process_item(item, param):
    """Keep processing logic separate for testability."""
    pass
```

## Step 5: Test Commands
```bash
# Run synchronously in dev (bypasses queue)
bench --site <site> execute <app>.tasks.<module>.<function_name> --args '{"<param1>": "value"}'

# Check queue health
bench --site <site> doctor

# Watch worker logs
tail -f logs/worker.log
```

## Step 6: Guardrails
Stop and ask if:
- The function calls `frappe.get_doc()` in a loop → fix the N+1 first with bulk fetch
- No `frappe.set_user()` at the top → add it before proceeding
- `frappe.db.commit()` appears inside the inner loop → move it to batch commits
- Task depends on `frappe.session.user` or `frappe.local` → pass user as explicit param

## Examples
```
/frappe-bg sync all pending Sales Orders to Shopify every hour
/frappe-bg convert generate_gst_report function in api/reports.py to background job
/frappe-bg import 50000 items from uploaded CSV with real-time progress bar
/frappe-bg check Razorpay payment status for all pending Payment Entries
```
