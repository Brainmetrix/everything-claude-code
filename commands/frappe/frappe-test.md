# Frappe Test
Write comprehensive unit and integration tests for Frappe code.

## Step 1: Read the Target Code
| $ARGUMENTS | Files to Read |
|-----------|---------------|
| DocType name | `doctype/<n>/<n>.py` + `doctype/<n>/<n>.json` |
| API file | `api/<file>.py` |
| Handler/task | `handlers/<file>.py` or `tasks/<file>.py` |
| Integration | `integrations/<file>.py` |
| Existing test file | Read it first to avoid duplication |

## Step 2: Identify All Test Cases
For each function/method found, identify:
- **Happy path** — valid input, expected success output
- **Validation failure** — missing required fields, invalid values
- **Permission denial** — wrong user or role
- **Edge case** — empty input, None, boundary values
- **State transition** — Draft→Submit, Submit→Cancel (if submittable)

Aim for **minimum 3 tests per public method**, **80%+ coverage** overall.

## Step 3: Generate Test File
Path: `apps/<app>/<app>/doctype/<doctype>/test_<doctype>.py`
or: `apps/<app>/<app>/tests/test_<module>.py`

```python
import frappe
import unittest
from frappe.test_runner import make_test_records


class Test<Target>(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Runs once for the class. Create shared test fixtures."""
        make_test_records("<DocType>", force=True)
        frappe.set_user("Administrator")

    def setUp(self):
        """Runs before each test. Reset to clean state."""
        frappe.set_user("Administrator")

    def tearDown(self):
        """ALWAYS rollback — never leave test data in DB."""
        frappe.db.rollback()

    # ── Happy Path ───────────────────────────────────────────────
    def test_<action>_success(self):
        doc = frappe.new_doc("<DocType>")
        doc.<field> = "<valid_value>"
        doc.insert()
        self.assertEqual(doc.<field>, "<expected>")
        self.assertTrue(frappe.db.exists("<DocType>", doc.name))

    # ── Validation ──────────────────────────────────────────────
    def test_missing_required_field_raises(self):
        doc = frappe.new_doc("<DocType>")
        # intentionally omit required field
        with self.assertRaises(frappe.ValidationError):
            doc.insert()

    # ── Permissions ─────────────────────────────────────────────
    def test_guest_cannot_read(self):
        frappe.set_user("Guest")
        with self.assertRaises(frappe.PermissionError):
            frappe.get_list("<DocType>")

    # ── Submit/Cancel (only if is_submittable) ───────────────────
    def test_submit_and_cancel(self):
        doc = frappe.new_doc("<DocType>")
        doc.<field> = "<value>"
        doc.insert()
        doc.submit()
        self.assertEqual(doc.docstatus, 1)
        doc.cancel()
        self.assertEqual(doc.docstatus, 2)

    # ── API Endpoint ─────────────────────────────────────────────
    def test_api_<function>_returns_expected_shape(self):
        frappe.set_user("Administrator")
        result = frappe.call("<app>.api.<module>.<function>", <param>="<value>")
        self.assertIsNotNone(result)
        self.assertIn("data", result)
        self.assertIsInstance(result["data"], list)
```

## Step 4: Run Tests
```bash
# Run all tests for the DocType
bench run-tests --app <app> --doctype "<DocType Name>" --verbose

# Run specific test file
bench run-tests --app <app> --module <app>.tests.test_<module> --verbose

# Run with coverage report
bench run-tests --app <app> --coverage
# Open htmlcov/index.html — must be 80%+
```

## Step 5: Guardrails
Stop and ask if:
- No `tearDown` with `frappe.db.rollback()` would be needed → add it unconditionally
- Test creates submitted documents → must cancel before rollback or use `ignore_permissions=True` on trash
- Testing background jobs → mock `enqueue` with `unittest.mock.patch`, do not actually enqueue in tests
- API test checks permissions → must test with both admin and restricted user

## Coverage Targets
| Code Type | Minimum Tests |
|-----------|--------------|
| `validate()` logic | One test per condition |
| `on_submit()` | Happy path + cancel reversal |
| Every `@frappe.whitelist()` | Success + permission denied |
| Background task function | Success + exception handling |
| Integration adapter | Success + mocked HTTP failure |

## Examples
```
/frappe-test CustomerCreditLimit doctype all lifecycle hooks
/frappe-test api/customer_portal.py all endpoints including permission checks
/frappe-test handlers/sales_order.py on_submit and on_cancel logic
/frappe-test integrations/razorpay.py signature verification with mocked responses
```
