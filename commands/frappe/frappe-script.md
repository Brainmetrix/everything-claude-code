# /frappe-script — Write Client Scripts for Frappe Desk Forms

## Purpose
Write JavaScript client scripts for Frappe Desk forms — custom buttons,
field triggers, form validations, dynamic field visibility, child table
logic, and custom form interactions.

## Input
$ARGUMENTS = DocType name and what the script should do

## Client Script Patterns

### Full Form Script Template
```javascript
// doctype/<doctype_name>/<doctype_name>.js
frappe.ui.form.on('<DocType Name>', {

    // ── Setup ───────────────────────────────────────────────────
    setup(frm) {
        // Runs once when form class is initialized
        frm.set_query('customer', () => ({
            filters: { disabled: 0, is_internal_customer: 0 }
        }));
    },

    // ── Refresh ─────────────────────────────────────────────────
    refresh(frm) {
        // Runs on every form refresh
        frm.trigger('set_indicators');

        // Conditional custom buttons
        if (frm.doc.docstatus === 1 && frm.doc.status === 'Pending Payment') {
            frm.add_custom_button(__('Mark as Paid'), () => {
                frappe.confirm(__('Confirm payment received?'), () => {
                    frm.call('mark_as_paid').then(() => {
                        frm.reload_doc();
                        frappe.show_alert({ message: __('Marked as paid'), indicator: 'green' });
                    });
                });
            }, __('Actions'));
        }

        // Read-only field based on condition
        frm.set_df_property('credit_limit', 'read_only', frm.doc.docstatus === 1);

        // Toggle section visibility
        frm.toggle_display('payment_section', frm.doc.payment_terms !== '');
    },

    // ── Field Triggers ───────────────────────────────────────────
    customer(frm) {
        if (!frm.doc.customer) { frm.set_value('customer_name', ''); return; }
        frappe.call({
            method: 'myapp.api.customer.get_details',
            args: { customer: frm.doc.customer },
            callback(r) {
                if (!r.message) return;
                frm.set_value('customer_name', r.message.customer_name);
                frm.set_value('credit_limit', r.message.credit_limit);
            }
        });
    },

    amount(frm) {
        frm.trigger('calculate_tax');
    },

    // ── Custom Helpers ───────────────────────────────────────────
    calculate_tax(frm) {
        const tax = flt(frm.doc.amount) * 0.18;
        frm.set_value('tax_amount', tax);
        frm.set_value('total_amount', flt(frm.doc.amount) + tax);
    },

    set_indicators(frm) {
        const color_map = {
            'Draft': 'grey', 'Pending': 'orange',
            'Approved': 'green', 'Rejected': 'red'
        };
        frm.page.set_indicator(
            frm.doc.status,
            color_map[frm.doc.status] || 'blue'
        );
    },
});

// ── Child Table Events ───────────────────────────────────────────
frappe.ui.form.on('<Child DocType>', {
    qty(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'amount', flt(row.qty) * flt(row.rate));
        frm.trigger('calculate_totals');
    },

    items_add(frm, cdt, cdn) {
        // Runs when a new row is added to child table
        frappe.model.set_value(cdt, cdn, 'uom', 'Nos');
    },

    items_remove(frm) {
        frm.trigger('calculate_totals');
    }
});
```

### Common Patterns Reference

**Fetch from linked doc:**
```javascript
frm.add_fetch('customer', 'customer_name', 'customer_name');
frm.add_fetch('item_code', 'standard_rate', 'rate');
```

**Field filter on Link:**
```javascript
frm.set_query('item_code', 'items', () => ({
    filters: { item_group: frm.doc.item_group, disabled: 0 }
}));
```

**Dialog with form:**
```javascript
const d = new frappe.ui.Dialog({
    title: 'Enter Details',
    fields: [
        { label: 'Reason', fieldname: 'reason', fieldtype: 'Small Text', reqd: 1 }
    ],
    primary_action_label: 'Submit',
    primary_action(values) {
        frm.call('custom_action', { reason: values.reason })
            .then(() => { d.hide(); frm.reload_doc(); });
    }
});
d.show();
```

## Examples
```
/frappe-script Sales Order add button to create Delivery Note with pre-filled items
/frappe-script Purchase Invoice auto-calculate TDS based on vendor category
/frappe-script Customer form show credit utilization bar and overdue amount
/frappe-script Sales Invoice items table auto-fetch HSN code and GST rate from Item
/frappe-script Payment Entry custom button to reconcile against open invoices
/frappe-script Employee form toggle sections based on employment type
```
