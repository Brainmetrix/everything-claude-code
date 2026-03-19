# /frappe-print — Create Print Formats and PDF Generation

## Purpose
Create custom Print Formats for DocTypes, PDF generation via API,
and custom letter heads for professional document output.

## Input
$ARGUMENTS = DocType name and what the print format should look like

## Print Format Types

### 1. Jinja Print Format (most flexible)
```html
<!-- Standard Frappe Print Format — set Format Type: Jinja -->
<style>
  .print-format { font-family: Arial, sans-serif; font-size: 12px; }
  .header { border-bottom: 2px solid #1B4F8A; margin-bottom: 20px; }
  .table { width: 100%; border-collapse: collapse; }
  .table th { background: #1B4F8A; color: white; padding: 8px; }
  .table td { border: 1px solid #ddd; padding: 6px; }
  .total-row { font-weight: bold; background: #f5f5f5; }
</style>

<div class="print-format">
  <!-- Header -->
  <div class="header">
    <table width="100%">
      <tr>
        <td><img src="{{ company_logo }}" height="60"></td>
        <td style="text-align:right">
          <h2>{{ doc.doctype }}</h2>
          <p><strong>{{ doc.name }}</strong></p>
        </td>
      </tr>
    </table>
  </div>

  <!-- Document Details -->
  <table width="100%">
    <tr>
      <td><strong>Customer:</strong> {{ doc.customer_name }}</td>
      <td><strong>Date:</strong> {{ doc.transaction_date }}</td>
    </tr>
  </table>

  <!-- Items Table -->
  <table class="table" style="margin-top:20px">
    <thead>
      <tr>
        <th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {% for item in doc.items %}
      <tr>
        <td>{{ item.item_name }}</td>
        <td>{{ item.qty }}</td>
        <td>{{ item.rate | money }}</td>
        <td>{{ item.amount | money }}</td>
      </tr>
      {% endfor %}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td>{{ doc.grand_total | money }}</td>
      </tr>
    </tfoot>
  </table>
</div>
```

### 2. Generate PDF via API
```python
@frappe.whitelist()
def download_pdf(doctype, name, format=None):
    """Generate and return PDF for any DocType."""
    frappe.has_permission(doctype, doc=name, throw=True)

    pdf_content = frappe.get_print(
        doctype=doctype,
        name=name,
        print_format=format or "Standard",
        as_pdf=True,
        letterhead="My Letter Head",
    )

    frappe.local.response.filename = f"{name}.pdf"
    frappe.local.response.filecontent = pdf_content
    frappe.local.response.type = "pdf"
```

### 3. Bulk PDF Generation (background)
```python
def bulk_print_invoices(invoice_names):
    """Generate PDFs for multiple invoices and zip them."""
    import zipfile, io
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        for name in invoice_names:
            pdf = frappe.get_print("Sales Invoice", name, as_pdf=True)
            zf.writestr(f"{name}.pdf", pdf)
    # Save to File DocType and return URL
```

## Always Include
- Print Format registered in fixtures
- Letter Head linked
- Correct margins for printing (top: 1cm, bottom: 1cm, left/right: 1cm)
- Page break handling for multi-page docs
- Signature/stamp section if needed
- Amount in words if it's a financial document

## Examples
```
/frappe-print Sales Invoice with GST details, amount in words, bank details
/frappe-print Purchase Order professional format with terms and conditions
/frappe-print Delivery Note with item-wise barcode and QR code
/frappe-print custom Tax Invoice format compliant with Indian GST rules
/frappe-print Employee Offer Letter with dynamic salary table
/frappe-print bulk PDF download API for multiple invoices as zip
```
