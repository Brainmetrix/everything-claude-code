# Frappe Performance
Diagnose and fix performance bottlenecks: slow queries, N+1, blocking HTTP, missing indexes.

## Step 1: Classify Bottleneck from $ARGUMENTS
| Symptom | Likely Cause | Start At |
|---------|-------------|----------|
| Slow page / list view | Unindexed filter or unbounded query | Read the list view query |
| Slow form load | Heavy `onload`, fetch_from chains | Read the client script + controller |
| Slow API response | N+1 or missing permission cache | Read the API function |
| Background job taking hours | N+1 in loop or missing batch commits | Read the task function |
| High DB CPU | Full table scans, no index | Run EXPLAIN on the query |

## Step 2: Read the Target Code
Read the file identified in Step 1 before diagnosing.

## Step 3: Run Diagnostic Queries
```bash
# Find slow queries
bench --site <site> mariadb
> SHOW FULL PROCESSLIST;
> SELECT * FROM information_schema.PROCESSLIST WHERE TIME > 2;

# EXPLAIN a specific query
> EXPLAIN SELECT ... FROM `tabSales Order` WHERE customer = 'CUST-001';
# Look for: type=ALL (bad), key=NULL (no index used)
```

## Step 4: Apply Fix Loop (one issue at a time)

**Fix: N+1 query in loop**
```python
# BEFORE (one query per iteration)
for name in order_names:
    doc = frappe.get_doc("Sales Order", name)

# AFTER (single bulk fetch)
docs = frappe.get_all("Sales Order",
    filters={"name": ["in", order_names]},
    fields=["name", "customer", "grand_total", "status"])
```

**Fix: Unbounded list**
```python
# BEFORE
frappe.get_list("Sales Order", filters=filters)

# AFTER
frappe.get_list("Sales Order", filters=filters, page_length=100, limit_page_length=100)
```

**Fix: Uncached Settings**
```python
# BEFORE (DB hit every call)
settings = frappe.get_doc("My Settings")

# AFTER (cached per request)
settings = frappe.get_cached_doc("My Settings")
```

**Fix: Missing DB index (via patch)**
```python
# patches/v<X>_<Y>/add_index_<field>.py
def execute():
    if not frappe.db.has_index("Sales Order", "customer"):
        frappe.db.add_index("Sales Order", ["customer"])
```

**Fix: Blocking HTTP request**
```python
# BEFORE (blocks for 30s)
@frappe.whitelist()
def generate_report(): ...heavy work...

# AFTER (returns job ID immediately)
@frappe.whitelist()
def generate_report():
    job = enqueue("myapp.tasks.generate_report", queue="long")
    return {"job_id": job.id, "message": "Report generation started"}
```

## Step 5: Verify Improvement
```bash
# Re-run EXPLAIN after adding index — should show type=ref or type=range
bench --site <site> mariadb
> EXPLAIN SELECT ...;

# Benchmark API response time
time curl -X POST https://<site>/api/method/<endpoint>
```

## Step 6: Guardrails
Stop and ask if:
- Adding index to a table with > 1M rows → warn about lock time, recommend doing it during maintenance window
- Caching a Settings doc that changes frequently → warn about stale data, ask about cache invalidation

## Examples
```
/frappe-perf Sales Order list view taking 8 seconds to load
/frappe-perf api/dashboard.py endpoint slow with 1000+ customers
/frappe-perf background sync_orders job running for 2 hours
/frappe-perf optimize monthly GST report query
```
