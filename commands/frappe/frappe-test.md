# /frappe-test — Write Tests for Frappe Code

## Purpose
Write comprehensive unit and integration tests for Frappe DocTypes,
APIs, background jobs, and hooks following Frappe test conventions.

## Input
$ARGUMENTS = DocType name, API file, or module to write tests for

## Steps

1. Read the target file(s) to understand what to test
2. Read existing test files in the module for patterns
3. Identify test cases:
   - Happy path (normal successful flow)
   - Validation failure (required fields, business rules)
   - Permission denial (wrong user/role)
   - Edge cases (empty input, boundary values, duplicate records)
   - Lifecycle transitions (Draft → Submit → Cancel)

## Test Structure Template
```python
import frappe
import unittest
from frappe.test_runner import make_test_records

class Test<DocTypeName>(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Runs once before all tests in this class."""
        make_test_records("<DocType>", force=True)
        frappe.set_user("Administrator")

    def setUp(self):
        """Runs before each test."""
        frappe.set_user("Administrator")

    def tearDown(self):
        """ALWAYS rollback after each test."""
        frappe.db.rollback()

    # ── Happy Path ──────────────────────────────────────────────
    def test_create_<doctype>_success(self):
        doc = frappe.new_doc("<DocType>")
        doc.field1 = "value"
        doc.insert()
        self.assertEqual(doc.status, "Draft")
        self.assertTrue(frappe.db.exists("<DocType>", doc.name))

    # ── Validation ──────────────────────────────────────────────
    def test_required_field_raises(self):
        doc = frappe.new_doc("<DocType>")
        # intentionally skip required field
        with self.assertRaises(frappe.ValidationError):
            doc.insert()

    # ── Permissions ─────────────────────────────────────────────
    def test_guest_cannot_access(self):
        frappe.set_user("Guest")
        with self.assertRaises(frappe.PermissionError):
            frappe.get_list("<DocType>")

    # ── API Endpoint ─────────────────────────────────────────────
    def test_api_returns_expected_structure(self):
        frappe.set_user("Administrator")
        result = frappe.call("myapp.api.<module>.<function>", param1="test")
        self.assertIsNotNone(result)
        self.assertIn("data", result)
```

## Coverage Target
Aim for 80%+ coverage. Always cover:
- All validate() conditions
- on_submit / on_cancel transitions
- Every @frappe.whitelist() endpoint
- Every background task function

## Run Tests
```bash
bench run-tests --app <app> --doctype "<DocType>" --verbose
bench run-tests --app <app> --module myapp.api.<module> --verbose
```

## Examples
```
/frappe-test CustomerCreditLimit doctype all lifecycle hooks
/frappe-test api/customer_portal.py all endpoints
/frappe-test handlers/sales_order.py on_submit and on_cancel
/frappe-test tasks/payment_sync.py background job with mocked API calls
/frappe-test integrations/razorpay.py signature verification logic
```
