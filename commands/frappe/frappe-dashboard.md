# /frappe-dashboard — Create Dashboards and Charts

## Purpose
Create Frappe Dashboards, Number Cards, and Charts that display
live business data. Covers both the no-code Dashboard DocType
and custom Vue/JS-based dashboards.

## Input
$ARGUMENTS = what KPIs or data should be on the dashboard

## Dashboard Components

### 1. Number Card (KPI metric)
```python
# Create via: Dashboard Number Card → New
# Or as fixture:
{
    "doctype": "Dashboard Number Card",
    "name": "Total Open Orders",
    "document_type": "Sales Order",
    "function": "Count",
    "filters_json": '[["docstatus","=",1],["status","!=","Closed"]]',
    "color": "#1B4F8A",
    "label": "Open Sales Orders"
}
```

### 2. Dashboard Chart
```python
# Chart types: Line, Bar, Percentage, Pie, Donut, Heatmap
{
    "doctype": "Dashboard Chart",
    "name": "Monthly Sales",
    "document_type": "Sales Invoice",
    "chart_type": "Sum",
    "based_on": "posting_date",
    "value_based_on": "grand_total",
    "timespan": "Last Year",
    "time_interval": "Monthly",
    "filters_json": '[["docstatus","=",1]]'
}
```

### 3. Custom API-backed Chart (Script Report → Chart)
```python
def get_chart_data(filters):
    data = frappe.db.sql("""
        SELECT
            MONTH(transaction_date) as month,
            SUM(grand_total) as total
        FROM `tabSales Order`
        WHERE docstatus = 1
          AND YEAR(transaction_date) = %(year)s
        GROUP BY MONTH(transaction_date)
    """, filters, as_dict=True)

    return {
        "data": {
            "labels": [row.month for row in data],
            "datasets": [{"values": [row.total for row in data]}]
        },
        "type": "bar",
        "colors": ["#1B4F8A"],
    }
```

### 4. Custom Vue Dashboard (for complex requirements)
```vue
<template>
  <div class="grid grid-cols-3 gap-4 p-4">
    <!-- KPI Cards -->
    <StatCard title="Open Orders" :value="stats.data?.open_orders" color="blue" />
    <StatCard title="Overdue Invoices" :value="stats.data?.overdue" color="red" />
    <StatCard title="Today's Collection" :value="stats.data?.collection" color="green" />

    <!-- Chart -->
    <div class="col-span-3">
      <BarChart :data="salesChart.data" />
    </div>
  </div>
</template>

<script setup>
import { createResource } from 'frappe-ui'
const stats = createResource({
    url: 'myapp.api.dashboard.get_stats',
    auto: true,
})
</script>
```

## Always Include
- Dashboard fixture for deployment consistency
- Refresh interval configuration
- Role-based access (who can see this dashboard)
- Mobile-responsive layout for Vue dashboards

## Examples
```
/frappe-dashboard sales team dashboard: open orders, today's collection, monthly target vs actual
/frappe-dashboard accounts dashboard: overdue invoices aging, daily receipts, pending payments
/frappe-dashboard operations dashboard: pending deliveries, stock alerts, open POs
/frappe-dashboard management executive view: revenue MTD, top customers, collection efficiency
/frappe-dashboard customer portal dashboard: their orders, invoices, payment history
/frappe-dashboard HR dashboard: headcount, attendance today, pending leave approvals
```
