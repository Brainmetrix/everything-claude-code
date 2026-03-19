# Frappe Script
Write client-side JavaScript for Frappe Desk forms.

## Step 1: Read Existing Files
1. Read `apps/<app>/<app>/doctype/<doctype>/<doctype>.js` if it exists
2. Read the DocType `.json` to know all field names, types, and child tables
3. Never overwrite — extend existing scripts unless a full rewrite is requested

## Step 2: Classify What to Add from $ARGUMENTS
| Indicator | Pattern to Generate |
|-----------|-------------------|
| "button", "custom action" | `frm.add_custom_button()` in `refresh()` |
| "field changes", "on change" | Field trigger function |
| "fetch from", "auto-fill" | `frm.add_fetch()` or `frappe.call()` |
| "filter link field" | `frm.set_query()` in `setup()` |
| "show/hide field" | `frm.toggle_display()` in `refresh()` |
| "child table", "row" | `frappe.ui.form.on('<Child DocType>', ...)` |
| "dialog", "popup" | `new frappe.ui.Dialog({...})` |
| "indicator", "badge" | `frm.page.set_indicator()` |
| "read-only based on" | `frm.set_df_property('field', 'read_only', ...)` |

## Step 3: Generate the Script

### Core structure (always use this skeleton):
```javascript
// doctype/<doctype_name>/<doctype_name>.js
frappe.ui.form.on('<DocType Name>', {

    // ── Setup (runs once on class init) ─────────────────────────
    setup(frm) {
        // Link field filters — set here, not in refresh
        frm.set_query('<link_field>', () => ({
            filters: { disabled: 0, <filter_key>: <filter_val> }
        }));
    },

    // ── Refresh (runs on every load and reload) ──────────────────
    refresh(frm) {
        // 1. Conditional custom buttons
        if (frm.doc.docstatus === 1 && frm.doc.<field> === '<value>') {
            frm.add_custom_button(__('<Button Label>'), () => {
                frappe.confirm(__('Are you sure?'), () => {
                    frm.call('<python_method_name>', {})
                        .then(r => {
                            frappe.show_alert({
                                message: __('Done!'), indicator: 'green'
                            });
                            frm.reload_doc();
                        });
                });
            }, __('<Group Name>'));   // group = dropdown category
        }

        // 2. Field visibility
        frm.toggle_display('<section_or_field>', frm.doc.<condition_field> !== '');

        // 3. Read-only after submit
        frm.set_df_property('<field>', 'read_only', frm.doc.docstatus > 0);

        // 4. Status indicator
        const colors = { Draft:'grey', Pending:'orange', Done:'green', Rejected:'red' };
        frm.page.set_indicator(
            frm.doc.workflow_state || frm.doc.status,
            colors[frm.doc.workflow_state || frm.doc.status] || 'blue'
        );
    },

    // ── Field trigger ────────────────────────────────────────────
    <linked_field>(frm) {
        if (!frm.doc.<linked_field>) {
            frm.set_value('<dependent_field>', null);
            return;
        }
        frappe.call({
            method: '<app>.api.<module>.<function>',
            args:   { <linked_field>: frm.doc.<linked_field> },
            callback(r) {
                if (!r.message) return;
                frm.set_value('<field1>', r.message.<field1>);
                frm.set_value('<field2>', r.message.<field2>);
            }
        });
    },
});

// ── Child Table Events ───────────────────────────────────────────
frappe.ui.form.on('<Child DocType>', {
    // Field change in child row
    qty(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'amount', flt(row.qty) * flt(row.rate));
        frm.refresh_field('items');
    },

    // Row added
    <child_table>_add(frm, cdt, cdn) {
        frappe.model.set_value(cdt, cdn, '<default_field>', '<default_value>');
    },
});
```

### Dialog pattern:
```javascript
function show_action_dialog(frm) {
    const d = new frappe.ui.Dialog({
        title: __('<Dialog Title>'),
        fields: [
            { label: __('<Field>'), fieldname: '<field>', fieldtype: 'Small Text', reqd: 1 }
        ],
        primary_action_label: __('Submit'),
        primary_action(values) {
            frm.call('<python_method>', values)
                .then(() => { d.hide(); frm.reload_doc(); });
        }
    });
    d.show();
}
```

## Step 4: Output as Complete File
Always output the **full file contents**, not a patch. State clearly at the top:
- Which file to replace/create
- Whether this is a full replacement or append

## Step 5: Verify Command
```bash
bench build --app <app>
# Then: open the DocType form in browser and test each trigger manually
```

## Step 6: Guardrails
Stop and ask if:
- Script needs to call a Python method that doesn't exist yet → generate the API endpoint first with `/frappe-api`
- More than 5 custom buttons on one form → ask which are most critical, suggest grouping under dropdown
- Child table DocType name is unclear → read the parent DocType `.json` to find `options` on the Table field

## Examples
```
/frappe-script Sales Order add button to create Delivery Note with pre-filled items
/frappe-script Purchase Invoice auto-calculate TDS based on supplier category
/frappe-script Customer form show credit utilization indicator and overdue amount
/frappe-script items child table auto-fetch HSN code and GST rate when item changes
/frappe-script Payment Entry dialog for reconciling against specific open invoices
```
