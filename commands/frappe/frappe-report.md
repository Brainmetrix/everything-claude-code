# Frappe Report
Create a Query Report or Script Report in the custom app.

## Step 1: Classify Report Type from $ARGUMENTS
| Type | Use When |
|------|---------|
| Query Report | Simple SQL aggregation, straightforward columns, no complex Python logic |
| Script Report | Calculated columns, nested data, conditional formatting, chart required |

Default to Query Report unless complex logic is needed.

## Step 2: Read App Structure
1. Check `apps/<app>/<app>/report/` for existing reports (follow naming pattern)
2. Read `CLAUDE.md` for module name

## Step 3: Generate Report Definition (`.json`)
```json
{
    "doctype": "Report",
    "name": "<Report Name>",
    "report_name": "<Report Name>",
    "ref_doctype": "<Primary DocType>",
    "report_type": "Script Report",
    "module": "<Module>",
    "is_standard": "No",
    "roles": [{"role": "System Manager"}, {"role": "<relevant_role>"}],
    "filters": [
        {"fieldname": "from_date", "label": "From Date", "fieldtype": "Date",
         "default": "eval:frappe.datetime.get_first_day(frappe.datetime.nowdate())", "reqd": 1},
        {"fieldname": "to_date",   "label": "To Date",   "fieldtype": "Date",
         "default": "eval:frappe.datetime.nowdate()", "reqd": 1},
        {"fieldname": "company",   "label": "Company",   "fieldtype": "Link",
         "options": "Company", "default": "eval:frappe.defaults.get_user_default('Company')"}
    ]
}
```

## Step 4: Generate Report Python File
```python
import frappe
from frappe import _

def execute(filters=None):
    filters = filters or {}
    validate_filters(filters)
    columns = get_columns()
    data    = get_data(filters)
    chart   = get_chart(data)        # optional
    return columns, data, None, chart

def validate_filters(filters):
    if filters.get("from_date") > filters.get("to_date"):
        frappe.throw(_("From Date cannot be after To Date"))

def get_columns():
    return [
        {"label": _("Document"), "fieldname": "name",   "fieldtype": "Link",
         "options": "<DocType>", "width": 160},
        {"label": _("Date"),     "fieldname": "date",   "fieldtype": "Date",   "width": 100},
        {"label": _("Amount"),   "fieldname": "amount", "fieldtype": "Currency","width": 130},
    ]

def get_data(filters):
    return frappe.db.sql("""
        SELECT
            name, <date_field> AS date, <amount_field> AS amount
        FROM `tab<DocType>`
        WHERE docstatus = 1
          AND <date_field> BETWEEN %(from_date)s AND %(to_date)s
          AND company = %(company)s
        ORDER BY <date_field> DESC
    """, filters, as_dict=True)

def get_chart(data):
    return {
        "data": {
            "labels": [row.get("date") for row in data],
            "datasets": [{"name": "Amount", "values": [row.get("amount", 0) for row in data]}]
        },
        "type": "bar",
        "colors": ["#1B4F8A"],
    }
```

## Step 5: Register and Access
```bash
bench --site <site> migrate
# Access via: Desk → Reports → <Module> → <Report Name>
```

## Step 6: Guardrails
Stop and ask if:
- Report queries more than 3 tables → suggest adding indexes first
- No date filter in $ARGUMENTS → always add from_date/to_date as default filters
- Report mixes multiple currencies → ask how to handle conversion

## Examples
```
/frappe-report Monthly Sales Summary by customer with bar chart
/frappe-report Overdue Invoices with aging buckets 0-30, 31-60, 61-90, 90+ days
/frappe-report GST Summary for filing: B2B, B2C, CDNR breakup
/frappe-report Payment Collection vs Target by sales person
```
