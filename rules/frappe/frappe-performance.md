# Frappe Performance Rules

## The five most expensive mistakes

### 1. get_doc() in a loop — N+1 query
```python
# WRONG
for name in names:
    doc = frappe.get_doc("Sales Order", name)

# CORRECT
docs = frappe.get_all("Sales Order",
    filters={"name": ["in", names]},
    fields=["name", "customer", "grand_total"])
```

### 2. get_list() without page_length
```python
# WRONG
frappe.get_list("Sales Invoice", filters={"docstatus": 1})

# CORRECT
frappe.get_list("Sales Invoice",
    filters={"docstatus": 1},
    fields=["name", "customer"],
    page_length=50)
```

### 3. Blocking HTTP with heavy work
```python
# WRONG
@frappe.whitelist()
def generate_report():
    # ... 30 seconds of work ...

# CORRECT
@frappe.whitelist()
def generate_report():
    enqueue("myapp.tasks.generate_report", queue="long")
    return {"status": "queued"}
```

### 4. Settings doc not cached
```python
frappe.get_cached_doc("Razorpay Settings")  # CORRECT
frappe.get_doc("Razorpay Settings")         # WRONG — DB hit every call
```

### 5. Raw SQL over ORM
```python
frappe.get_list("Sales Order", filters={"status": "Open"})  # CORRECT
frappe.db.sql("SELECT name FROM `tabSales Order` WHERE status='Open'")  # UNNECESSARY
```

## Queue selection
- `short` < 5 min: emails, notifications
- `default` < 30 min: reports, syncs
- `long` < 1 hour: bulk imports, full ERP syncs

## Performance checklist
- [ ] No `get_doc()` or `get_value()` inside a `for` loop
- [ ] All `get_list()`/`get_all()` have `page_length` set
- [ ] No heavy work blocking an HTTP request
- [ ] `get_cached_doc()` for Settings/Single DocTypes
- [ ] Fields specified explicitly (not `fields=["*"]`)
