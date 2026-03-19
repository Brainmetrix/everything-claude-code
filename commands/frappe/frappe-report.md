# /frappe-report — Create a Frappe Report

## Purpose
Create a Query Report or Script Report in the custom app with proper
filters, columns, permissions, and optionally a chart.

## Input
$ARGUMENTS = report name and what data it should show

## Report Type Selection
- **Query Report** → SQL-based, simpler, for straightforward data display
- **Script Report** → Python-based, complex logic, calculated columns, nested data

## Query Report Template
```python
# report/<report_name>/<report_name>.py
from frappe import _

def execute(filters=None):
    filters = filters or {}
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {"label": _("Document"), "fieldname": "name", "fieldtype": "Link",
         "options": "DocType", "width": 150},
        {"label": _("Date"), "fieldname": "date", "fieldtype": "Date", "width": 100},
        {"label": _("Amount"), "fieldname": "amount", "fieldtype": "Currency", "width": 120},
    ]

def get_data(filters):
    conditions = get_conditions(filters)
    return frappe.db.sql(f"""
        SELECT name, date, amount
        FROM `tabDocType`
        WHERE docstatus = 1 {conditions}
        ORDER BY date DESC
    """, filters, as_dict=True)

def get_conditions(filters):
    conditions = []
    if filters.get("from_date"):
        conditions.append("AND date >= %(from_date)s")
    return " ".join(conditions)
```

## Always Include
- Report .json with correct module, filters definition, roles
- report .py with columns, data, conditions functions
- Standard filters: from_date, to_date, company at minimum
- Chart definition if data is chartable
- Correct permissions (which roles can see this report)

## Output
1. `<report_name>.json` — report definition
2. `<report_name>.py` — data logic
3. How to access: Desk → Reports → <Module> → <Report Name>

## Examples
```
/frappe-report Monthly Sales Summary by customer with chart
/frappe-report Overdue Invoices with aging buckets: 0-30, 31-60, 61-90, 90+ days
/frappe-report Stock Movement report with item-wise in/out/balance
/frappe-report Employee Attendance Summary for payroll period
/frappe-report Payment Collection vs Target by sales person
/frappe-report GST Summary report for filing: B2B, B2C, CDNR
/frappe-report Supplier Outstanding with payment terms breakdown
```
