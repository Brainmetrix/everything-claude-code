---
description: "Frappe/ERPNext performance — N+1 prevention, page_length, cached_doc, background jobs"
globs: ["**/*.py"]
alwaysApply: true
---

# Frappe Performance Rules

## N+1 query — most common mistake
```python
# WRONG — one DB query per iteration
for name in names:
    doc = frappe.get_doc("Sales Order", name)

# CORRECT — single bulk fetch
docs = frappe.get_all("Sales Order",
    filters={"name": ["in", names]},
    fields=["name", "customer", "grand_total"])
```

## Always set page_length
```python
frappe.get_list("Sales Invoice",
    filters={"docstatus": 1},
    fields=["name", "customer"],
    page_length=50)      # REQUIRED — never omit
```

## Heavy work must be enqueued
```python
# WRONG — blocks gunicorn worker
@frappe.whitelist()
def generate_report():
    # ... 30 seconds ...

# CORRECT
@frappe.whitelist()
def generate_report():
    enqueue("myapp.tasks.generate_report", queue="long")
    return {"status": "queued"}
```

## Always cache Settings docs
```python
frappe.get_cached_doc("Razorpay Settings")  # CORRECT
frappe.get_doc("Razorpay Settings")         # WRONG — DB hit every call
```

## Queue selection
- `short` → < 5 min: emails, notifications
- `default` → < 30 min: reports, syncs
- `long` → < 1 hour: bulk imports, full ERP syncs
