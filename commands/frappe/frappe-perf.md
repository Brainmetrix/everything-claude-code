# /frappe-perf — Diagnose and Fix Performance Issues

## Purpose
Identify and fix performance bottlenecks in Frappe apps: slow queries,
N+1 problems, missing indexes, blocking HTTP requests, bloated context.

## Input
$ARGUMENTS = what is slow or the file/query to optimize

## Diagnostic Steps

### Step 1 — Classify the bottleneck
- **Slow page load** → check report query, DocType list view filters
- **Slow form load** → check fetch_from fields, onload scripts, heavy validate()
- **Slow API response** → check for missing has_permission cache, unindexed filters
- **Background job taking too long** → check for N+1, missing batch processing
- **High DB load** → check for missing indexes, full table scans

### Step 2 — Find slow queries
```bash
# Enable slow query log in MariaDB
bench --site <site> mariadb
> SET GLOBAL slow_query_log = ON;
> SET GLOBAL long_query_time = 1;  -- log queries > 1 second

# Or use EXPLAIN
EXPLAIN SELECT * FROM `tabSales Order` WHERE customer = 'CUST-001';

# Frappe query profiler
bench --site <site> console
>>> import frappe
>>> frappe.db.sql("EXPLAIN SELECT ...")
```

### Step 3 — Common Fixes Applied

**N+1 in a loop:**
```python
# ❌ WRONG
for name in order_names:
    doc = frappe.get_doc("Sales Order", name)  # one query per iteration

# ✅ CORRECT
docs = frappe.get_all("Sales Order",
    filters={"name": ["in", order_names]},
    fields=["name", "customer", "grand_total"])
```

**Missing index via patch:**
```python
# patches/v2_0/add_index_sales_order_customer.py
def execute():
    if not frappe.db.has_index("tabSales Order", "customer"):
        frappe.db.add_index("Sales Order", ["customer"])
```

**Uncached Settings doc:**
```python
# ❌ WRONG — fetches from DB every call
settings = frappe.get_doc("My Settings")

# ✅ CORRECT — cached in request context
settings = frappe.get_cached_doc("My Settings")
```

**Heavy work in HTTP:**
```python
# ❌ WRONG — blocks for 30 seconds
@frappe.whitelist()
def generate_report():
    # heavy processing...

# ✅ CORRECT — enqueue and return job id
@frappe.whitelist()
def generate_report():
    job = enqueue("myapp.tasks.generate_report", queue="long")
    return {"job_id": job.id}
```

## Output
1. Identified bottleneck (specific file + line)
2. Fix with before/after code
3. How to verify improvement

## Examples
```
/frappe-perf Sales Order list view taking 8 seconds to load
/frappe-perf api/dashboard.py endpoint slow with 1000+ customers
/frappe-perf background job sync_orders running for 2 hours
/frappe-perf optimize the monthly GST report query
/frappe-perf Customer portal page loads slow on mobile
```
