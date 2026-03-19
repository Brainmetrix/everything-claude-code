# /frappe-new — Scaffold a New Frappe DocType

## Purpose
Scaffold a complete, production-ready Frappe DocType from a description.
Generates all 4 files: .json schema, .py controller, .js client script, test file.

## Input
$ARGUMENTS = DocType name and optional field descriptions

## Steps (always follow in order)

1. Read CLAUDE.md and hooks.py before generating anything
2. Confirm the plan — state DocType name, module, fields, child tables.
   Wait for confirmation if $ARGUMENTS is vague.
3. Generate these 4 files:

### `<doctype_name>.json`
- Correct module placement under the custom app
- Fields with proper fieldtype, label, reqd, in_list_view, in_filter flags
- Naming series if applicable (e.g. INVPAY-.YYYY.-.#####)
- Permissions for System Manager, relevant roles
- is_submittable: 1 if the DocType has a workflow (submit/cancel)

### `<doctype_name>.py`
- Controller class extending Document
- validate(), before_insert(), after_insert(), on_submit(), on_cancel(), on_trash() with docstrings
- Use `frappe.throw(_("..."))` for validation errors, never bare raise
- Use `frappe.has_permission()` where data is sensitive
- No frappe.db.commit() anywhere in controller

### `<doctype_name>.js`
- `frappe.ui.form.on` block with refresh()
- Conditional custom buttons based on docstatus
- Field change triggers for key linked fields
- Child table row triggers if child tables present

### `test_<doctype_name>.py`
- setUpClass with make_test_records
- At least 3 tests: happy path insert, validation failure, status transition
- tearDown with frappe.db.rollback()

4. Output bench commands to migrate and run tests

## Output Format
Show each file with filename as header. End with:
```
bench --site <your-site> migrate
bench run-tests --app <your-app> --doctype "<DocType Name>"
```

## Examples
```
/frappe-new Supplier Payment Reconciliation with fields: supplier (Link/Supplier), 
  reconciliation_date (Date), status (Select: Draft/Reconciled/Disputed), 
  total_amount (Currency), remarks (Text)
/frappe-new Customer Credit Limit with child table for product-wise limits
/frappe-new Delivery Schedule with is_submittable, linked to Sales Order
```
