# /frappe-import — Bulk Data Import into Frappe

## Purpose
Import bulk data into Frappe DocTypes from CSV/Excel files,
via API, or through the data import tool — with validation,
error handling, and progress tracking.

## Input
$ARGUMENTS = what data to import and from what source

## Import Methods

### Method 1 — Frappe Data Import Tool (no-code, small datasets < 5000 rows)
```
Desk → Data Import → New
- DocType: Sales Order
- Import Type: Insert New Records
- Download Template → fill data → Upload → Import
```

### Method 2 — frappe.db.bulk_insert (fastest, large datasets)
```python
def import_items_from_csv(file_path):
    import csv
    frappe.set_user("Administrator")

    rows = []
    errors = []

    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            try:
                validate_row(row, i)
                rows.append({
                    "name": frappe.generate_hash(length=10),
                    "item_code": row["item_code"],
                    "item_name": row["item_name"],
                    "item_group": row.get("item_group", "All Item Groups"),
                    "stock_uom": row.get("uom", "Nos"),
                    "creation": frappe.utils.now(),
                    "modified": frappe.utils.now(),
                    "owner": "Administrator",
                    "modified_by": "Administrator",
                    "docstatus": 0,
                })
            except Exception as e:
                errors.append({"row": i + 2, "error": str(e)})

            # Batch commit every 500 rows
            if len(rows) >= 500:
                frappe.db.bulk_insert("Item", rows)
                frappe.db.commit()
                rows = []

    if rows:
        frappe.db.bulk_insert("Item", rows)
        frappe.db.commit()

    return {"imported": i + 1 - len(errors), "errors": errors}
```

### Method 3 — Background Import with Progress (for uploads via UI)
```python
@frappe.whitelist()
def start_import(file_url):
    """Trigger import as background job."""
    enqueue(
        "myapp.tasks.import_data.run_import",
        queue="long",
        timeout=3600,
        job_id=f"import_{frappe.session.user}_{frappe.utils.now()}",
        file_url=file_url,
        user=frappe.session.user,
    )
    return {"message": "Import started. You will be notified when complete."}

def run_import(file_url, user):
    frappe.set_user("Administrator")
    total = count_rows(file_url)
    for i, row in enumerate(read_rows(file_url)):
        process_row(row)
        # Publish progress every 50 rows
        if i % 50 == 0:
            frappe.publish_realtime(
                "progress",
                {"progress": [i, total], "title": "Importing data..."},
                user=user
            )
        if i % 500 == 0:
            frappe.db.commit()
    frappe.db.commit()
    frappe.publish_realtime("import_complete", {"imported": total}, user=user)
```

## Validation Template
```python
def validate_row(row, index):
    required = ["item_code", "item_name"]
    for field in required:
        if not row.get(field):
            raise ValueError(f"Row {index + 2}: '{field}' is required")
    # Check for duplicate
    if frappe.db.exists("Item", row["item_code"]):
        raise ValueError(f"Row {index + 2}: Item '{row['item_code']}' already exists")
```

## Examples
```
/frappe-import 50000 items from CSV with item_code, name, group, UOM, price
/frappe-import historical Sales Orders from legacy system via Excel
/frappe-import customer list from CRM export with deduplication logic
/frappe-import opening stock balances for all warehouses
/frappe-import employee records from HR spreadsheet with validation
/frappe-import chart of accounts from Tally export XML
```
