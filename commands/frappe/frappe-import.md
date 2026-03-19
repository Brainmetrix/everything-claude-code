# Frappe Import
Bulk import data into Frappe DocTypes from CSV/Excel with validation and progress.

## Step 1: Classify from $ARGUMENTS
| Method | Use When | Row Limit |
|--------|---------|-----------|
| Frappe Data Import Tool | Simple, no code, one-time | < 5,000 |
| Script via `frappe.db.bulk_insert` | Large dataset, max speed | Any |
| Background job with progress | Triggered from UI, user feedback needed | Any |

Default to Background job with progress for anything > 1,000 rows.

## Step 2: Read DocType Schema
Read `apps/<app>/<app>/doctype/<doctype>/<doctype>.json` to:
- Identify required fields (`"reqd": 1`)
- Identify Link fields (need validation against linked DocType)
- Identify field types (Date format, Currency precision, etc.)

## Step 3: Generate Validation Function
```python
def validate_row(row, index):
    """Validate a single CSV row. Raises ValueError on failure."""
    errors = []
    row_num = index + 2  # +1 for header, +1 for 1-based

    # Required field checks
    for field in ["<required_field_1>", "<required_field_2>"]:
        if not row.get(field, "").strip():
            errors.append(f"Row {row_num}: '{field}' is required")

    # Link field validation
    if row.get("<link_field>"):
        if not frappe.db.exists("<Linked DocType>", row["<link_field>"]):
            errors.append(f"Row {row_num}: {row['<link_field>']} not found in <Linked DocType>")

    # Duplicate check
    if frappe.db.exists("<DocType>", row.get("<unique_field>")):
        errors.append(f"Row {row_num}: '{row.get('<unique_field>')}' already exists")

    if errors:
        raise ValueError("; ".join(errors))
```

## Step 4: Generate Import Function

**Background job (recommended for > 1,000 rows):**
```python
# api/import_data.py
@frappe.whitelist()
def start_import(file_url, doctype):
    """Trigger bulk import as background job."""
    enqueue(
        "myapp.tasks.import_data.run_import",
        queue="long",
        timeout=7200,
        job_id=f"import_{doctype}_{frappe.session.user}",
        file_url=file_url,
        doctype=doctype,
        user=frappe.session.user,
    )
    return {"message": _("Import started. You will be notified on completion.")}

# tasks/import_data.py
def run_import(file_url, doctype, user):
    import csv, io
    frappe.set_user("Administrator")

    # Read file
    file_doc = frappe.get_doc("File", {"file_url": file_url})
    content  = file_doc.get_content().decode("utf-8-sig")  # handle BOM
    rows     = list(csv.DictReader(io.StringIO(content)))
    total    = len(rows)
    imported = 0
    errors   = []

    for i, row in enumerate(rows):
        try:
            validate_row(row, i)
            doc = frappe.new_doc(doctype)
            doc.update({
                "<field1>": row.get("<csv_col_1>", "").strip(),
                "<field2>": row.get("<csv_col_2>", "").strip(),
            })
            doc.insert(ignore_permissions=True)
            imported += 1
        except Exception as e:
            errors.append({"row": i + 2, "error": str(e)})

        # Progress every 50 rows
        if i % 50 == 0:
            frappe.publish_realtime(
                "progress",
                {"progress": [i + 1, total],
                 "title":    f"Importing {doctype}... ({i+1}/{total})"},
                user=user,
            )

        # Batch commit every 500 rows
        if (i + 1) % 500 == 0:
            frappe.db.commit()

    frappe.db.commit()  # final commit

    # Notify completion
    frappe.publish_realtime(
        "import_complete",
        {"imported": imported, "errors": len(errors),
         "error_detail": errors[:20]},  # send first 20 errors only
        user=user,
    )
    frappe.log_error(
        f"Import complete: {imported} rows. Errors: {errors}",
        f"{doctype} Import"
    )
```

## Step 5: Generate CSV Template
Print the expected CSV header row based on the DocType fields:
```
<required_field_1>,<required_field_2>,<link_field>,<optional_field>
```
With one example data row:
```
value1,value2,LINKED-001,optional
```

## Step 6: Test Commands
```bash
# Upload CSV to Frappe Files, get the file_url, then:
bench --site <site> console
>>> frappe.call("myapp.api.import_data.start_import",
...     file_url="/files/my_import.csv", doctype="<DocType>")

# Watch progress in worker logs
tail -f logs/worker.log
```

## Step 7: Guardrails
Stop and ask if:
- Import would overwrite existing submitted documents → block; submitted docs cannot be overwritten
- CSV has more than 20 columns → ask which columns map to which DocType fields before generating
- Importing financial data (Payment Entry, Journal Entry) → warn to test on staging first with 10 rows

## Examples
```
/frappe-import 50000 items from CSV with item_code, name, group, UOM, standard rate
/frappe-import customer list from CRM export with deduplication on customer_name
/frappe-import opening stock balances for all warehouses from Excel
/frappe-import employee records from HR spreadsheet with department and designation
```
