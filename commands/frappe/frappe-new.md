# Frappe New DocType
Scaffold a complete, production-ready Frappe DocType with all 4 required files.

## Step 1: Parse $ARGUMENTS
Extract from the user's description:
| Element | How to Extract |
|---------|---------------|
| DocType name | First noun phrase (e.g. "Supplier Payment Reconciliation") |
| Fields | Any listed fields with types; if missing, infer sensible defaults |
| Child tables | Any mention of "child table", "items", "rows" |
| Is submittable | Any mention of "submit", "approve", "cancel", "amend" |
| Module | Read `modules.txt` or infer from app structure |

If DocType name is unclear → ask ONE question before proceeding.

## Step 2: Read Project Structure
1. Read `CLAUDE.md` for app name and conventions
2. Read `apps/<app>/modules.txt` for correct module name
3. Check `apps/<app>/<app>/doctype/` to confirm no naming conflict

## Step 3: Generate `<doctype_name>.json`
Build the DocType schema with:
- Correct `module`, `name`, `doctype` fields
- `naming_rule`: "Naming Series" with sensible series (e.g. `RECPAY-.YYYY.-.#####`)
- `is_submittable`: 1 only if submit flow is needed
- Fields array — every field must have: `fieldname`, `fieldtype`, `label`
- Required fields marked with `"reqd": 1`
- Key fields with `"in_list_view": 1`, `"in_filter": 1`
- Permissions for System Manager (full), relevant role (read/write/create)

## Step 4: Generate `<doctype_name>.py`
Write the controller with:
```python
import frappe
from frappe import _
from frappe.model.document import Document

class <DocTypeName>(Document):
    def validate(self):
        """Called on every save."""
        self._validate_<key_field>()

    def before_insert(self):
        """Set defaults for new records."""
        pass

    def after_insert(self):
        """Post-insert actions (notifications, child record creation)."""
        pass

    def on_submit(self):       # only if is_submittable
        """Lock record and trigger downstream actions."""
        pass

    def on_cancel(self):       # only if is_submittable
        """Reverse on_submit actions."""
        pass

    def on_trash(self):
        """Prevent deletion of linked records."""
        pass

    def _validate_<key_field>(self):
        if not self.<key_field>:
            frappe.throw(_("<Key Field> is required"), frappe.MandatoryError)
```
Rules: no `frappe.db.commit()`, no bare `raise`, always `frappe.throw(_(...))`.

## Step 5: Generate `<doctype_name>.js`
Write the client script with:
```javascript
frappe.ui.form.on('<DocType Name>', {
    setup(frm) {
        // Link field filters
    },
    refresh(frm) {
        // Conditional buttons based on docstatus
        // Toggle field visibility
    },
    <key_linked_field>(frm) {
        // Fetch related data when link changes
    }
});
```

## Step 6: Generate `test_<doctype_name>.py`
Write at minimum 3 tests:
```python
class Test<DocTypeName>(unittest.TestCase):
    @classmethod
    def setUpClass(cls): ...      # make_test_records

    def test_insert_success(self): ...       # happy path
    def test_required_field_raises(self): ...# validation failure
    def test_submit_cancel(self): ...        # if submittable

    def tearDown(self):
        frappe.db.rollback()      # ALWAYS
```

## Step 7: Output Bench Commands
```bash
bench --site <site> migrate
bench run-tests --app <app> --doctype "<DocType Name>" --verbose
```

## Step 8: Guardrails
Stop and ask if:
- More than 20 fields → confirm field list before generating
- Child table mentioned but not described → ask for child table fields
- Naming conflict found in existing doctypes → report and ask for new name

## Examples
```
/frappe-new Supplier Payment Reconciliation with fields: supplier, date, amount, status
/frappe-new Customer Credit Limit with child table for product-wise limits
/frappe-new Delivery Schedule linked to Sales Order, is submittable
```
