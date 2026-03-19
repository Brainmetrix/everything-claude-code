# Frappe Dashboard
Create a Frappe Dashboard with Number Cards, Charts, and live data.

## Step 1: Classify from $ARGUMENTS
| Component Needed | Indicator |
|-----------------|-----------|
| Number Card (single KPI) | "total X", "count of", "sum of" |
| Dashboard Chart | "trend", "monthly", "bar chart", "line chart" |
| Full Dashboard | "dashboard", multiple KPIs mentioned |
| Custom Vue dashboard | "real-time", "interactive", "complex layout" |

Default to Frappe's built-in Dashboard + Number Cards + Charts (fixture-based).
Use custom Vue only if real-time updates or complex interactions are required.

## Step 2: Read Data Source
1. Identify which DocType(s) hold the data
2. Read the DocType `.json` to confirm field names
3. Read `apps/<app>/<app>/api/` for any existing stats endpoints

## Step 3: Generate Number Cards
For each KPI in $ARGUMENTS, generate a fixture JSON:
```json
{
    "doctype": "Dashboard Number Card",
    "name": "<Descriptive Name>",
    "document_type": "<DocType>",
    "function": "Count",
    "filters_json": "[[\\"docstatus\\",\\"=\\",1],[\\"status\\",\\"!=\\",\\"Closed\\"]]",
    "color": "#1B4F8A",
    "label": "<Human-Readable Label>",
    "module": "<Module>"
}
```
Function options: `Count`, `Sum`, `Average`, `Min`, `Max`

## Step 4: Generate Dashboard Chart
```json
{
    "doctype": "Dashboard Chart",
    "name": "<Chart Name>",
    "document_type": "<DocType>",
    "chart_type": "Sum",
    "based_on": "<date_field>",
    "value_based_on": "<amount_field>",
    "timespan": "Last Year",
    "time_interval": "Monthly",
    "filters_json": "[[\\"docstatus\\",\\"=\\",1]]",
    "chart_name": "<Chart Name>",
    "module": "<Module>"
}
```
Chart types: `Line`, `Bar`, `Percentage`, `Pie`, `Donut`, `Heatmap`

## Step 5: Generate Dashboard Definition
```json
{
    "doctype": "Dashboard",
    "name": "<Dashboard Name>",
    "module": "<Module>",
    "is_default": 0,
    "cards": [
        {"card": "<Card Name 1>"},
        {"card": "<Card Name 2>"}
    ],
    "charts": [
        {"chart": "<Chart Name>", "width": "Full"}
    ]
}
```

## Step 6: Generate Custom API (if chart needs complex logic)
```python
# api/dashboard.py
@frappe.whitelist()
def get_stats():
    frappe.has_permission("Sales Order", throw=True)
    return {
        "open_orders":     frappe.db.count("Sales Order",
                               {"docstatus": 1, "status": "To Deliver and Bill"}),
        "overdue_invoices":frappe.db.count("Sales Invoice",
                               {"docstatus": 1, "outstanding_amount": [">", 0],
                                "due_date":   ["<", frappe.utils.today()]}),
        "today_collection":frappe.db.get_value("Payment Entry",
                               {"docstatus": 1,
                                "posting_date": frappe.utils.today()},
                               "sum(paid_amount)") or 0,
    }
```

## Step 7: Export Fixtures
```bash
bench --site <site> export-fixtures --app <app>
git add <app>/fixtures/
git commit -m "feat(dashboard): add <Dashboard Name> dashboard"
# Access: Desk → Dashboards → <Dashboard Name>
```

## Step 8: Guardrails
Stop and ask if:
- More than 6 Number Cards requested → recommend grouping into multiple dashboards
- Chart requires data from multiple DocTypes → must use Script Report as data source, not built-in chart
- Real-time refresh needed → recommend custom Vue dashboard via `/frappe-vue`

## Examples
```
/frappe-dashboard sales team: open orders, today collection, monthly target vs actual chart
/frappe-dashboard accounts: overdue invoices aging, daily receipts, pending payments
/frappe-dashboard management: revenue MTD, top 5 customers, collection efficiency trend
/frappe-dashboard operations: pending deliveries, stock alerts, open purchase orders
```
