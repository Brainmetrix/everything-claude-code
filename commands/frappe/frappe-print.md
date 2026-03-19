# Frappe Print Format
Create a custom Print Format for a DocType or a PDF generation API.

## Step 1: Classify Task from $ARGUMENTS
| Task | Indicator |
|------|-----------|
| New print format | "create", "design", "print format for X" |
| PDF download API | "download pdf", "generate pdf via API", "bulk PDF" |
| Fix existing | "blank", "broken", "not printing" |

## Step 2: Read DocType Structure
Read `apps/<app>/<app>/doctype/<doctype>/<doctype>.json` to understand:
- All field names and types
- Child table names and their fields
- Whether the DocType is submittable

## Step 3: Generate Print Format HTML
Create file: `apps/<app>/<app>/print_formats/<format_name>.html`

```html
<style>
  /* Reset */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; }

  /* Layout */
  .pf-header  { border-bottom: 2px solid #1B4F8A; padding-bottom: 12px; margin-bottom: 16px; }
  .pf-section { margin-bottom: 16px; }
  .pf-label   { font-weight: bold; color: #555; font-size: 9pt; }

  /* Table */
  .pf-table           { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .pf-table th        { background: #1B4F8A; color: #fff; padding: 6px 8px;
                        font-size: 9pt; text-align: left; }
  .pf-table td        { border: 1px solid #ddd; padding: 5px 8px; font-size: 10pt; }
  .pf-table tr:nth-child(even) td { background: #f9f9f9; }
  .pf-total-row td    { font-weight: bold; background: #eef3f8 !important; }

  /* Footer */
  .pf-footer  { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 8px;
                font-size: 9pt; color: #777; }

  /* Page break for long docs */
  .page-break { page-break-after: always; }
</style>

<!-- HEADER: Company + Document Info -->
<div class="pf-header">
  <table width="100%"><tr>
    <td width="60%">
      {% if letter_head %}<div>{{ letter_head }}</div>{% endif %}
      <div style="font-size:9pt;color:#555">{{ doc.company }}</div>
    </td>
    <td width="40%" style="text-align:right">
      <div style="font-size:16pt;font-weight:bold;color:#1B4F8A">
        {{ doc.doctype | upper }}
      </div>
      <div class="pf-label">{{ doc.name }}</div>
      <div style="font-size:9pt">Date: {{ doc.<date_field> }}</div>
    </td>
  </tr></table>
</div>

<!-- PARTY INFO -->
<div class="pf-section">
  <table width="100%"><tr>
    <td width="50%">
      <div class="pf-label">Bill To</div>
      <div>{{ doc.<customer_field> }}</div>
      {% if doc.<address_field> %}<div style="font-size:9pt">{{ doc.<address_field> }}</div>{% endif %}
    </td>
    <td width="50%">
      <table style="float:right">
        {% for label, value in [
            ("Due Date",  doc.<due_date_field>),
            ("Terms",     doc.<payment_terms_field>),
        ] %}
        <tr>
          <td class="pf-label" style="padding-right:12px">{{ label }}</td>
          <td>{{ value or "—" }}</td>
        </tr>
        {% endfor %}
      </table>
    </td>
  </tr></table>
</div>

<!-- ITEMS TABLE -->
<table class="pf-table">
  <thead><tr>
    <th style="width:8%">#</th>
    <th style="width:40%">Item</th>
    <th style="width:10%">Qty</th>
    <th style="width:12%">UOM</th>
    <th style="width:15%">Rate</th>
    <th style="width:15%">Amount</th>
  </tr></thead>
  <tbody>
    {% for item in doc.items %}
    <tr>
      <td>{{ loop.index }}</td>
      <td>{{ item.item_name }}
        {% if item.description %}
        <div style="font-size:8pt;color:#666">{{ item.description }}</div>
        {% endif %}
      </td>
      <td>{{ item.qty }}</td>
      <td>{{ item.uom }}</td>
      <td style="text-align:right">{{ item.rate | money }}</td>
      <td style="text-align:right">{{ item.amount | money }}</td>
    </tr>
    {% endfor %}
  </tbody>
  <tfoot>
    <tr class="pf-total-row">
      <td colspan="5" style="text-align:right">Grand Total</td>
      <td style="text-align:right">{{ doc.grand_total | money }}</td>
    </tr>
    {% if doc.in_words %}
    <tr><td colspan="6" style="font-size:9pt;font-style:italic">
      In Words: {{ doc.in_words }}
    </td></tr>
    {% endif %}
  </tfoot>
</table>

<!-- FOOTER -->
<div class="pf-footer">
  <table width="100%"><tr>
    <td>{{ doc.terms or "" }}</td>
    <td style="text-align:right">
      <div style="margin-top:40px;border-top:1px solid #aaa;padding-top:4px">
        Authorised Signatory
      </div>
    </td>
  </tr></table>
</div>
```

## Step 4: Generate PDF Download API (if requested)
```python
@frappe.whitelist()
def download_pdf(doctype, name, format_name=None):
    """Generate and stream a PDF for any DocType."""
    frappe.has_permission(doctype, doc=name, throw=True)
    pdf = frappe.get_print(
        doctype=doctype,
        name=name,
        print_format=format_name or "Standard",
        as_pdf=True,
        letterhead=frappe.db.get_single_value("Print Settings", "default_letter_head"),
    )
    frappe.local.response.filename     = f"{name}.pdf"
    frappe.local.response.filecontent  = pdf
    frappe.local.response.type         = "pdf"
```

## Step 5: Register in Fixtures
```bash
bench --site <site> export-fixtures --app <app>
git add <app>/fixtures/
git commit -m "feat(print): add <Format Name> print format"
```

## Step 6: Guardrails
Stop and ask if:
- Format needs GST fields → ask which GST type (B2B/B2C) and tax component names
- Needs barcode or QR code → confirm the field containing the value to encode
- Existing standard format exists → ask whether to replace or create a new named format

## Examples
```
/frappe-print Sales Invoice with GST details, amount in words, bank details
/frappe-print Purchase Order professional format with terms and conditions
/frappe-print Delivery Note with item barcodes
/frappe-print bulk PDF download API for multiple invoices returned as zip
```
