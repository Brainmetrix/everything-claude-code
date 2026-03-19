# Frappe Testing Rules

## TDD workflow — always write the failing test first
1. Write failing test (RED) → run bench → confirm failure
2. Write minimal implementation (GREEN) → run bench → confirm pass
3. Refactor if needed → re-run → still GREEN

## Test structure
```python
class TestMyDocType(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        make_test_records("MyDocType", force=True)
        frappe.set_user("Administrator")

    def setUp(self):
        frappe.set_user("Administrator")

    def tearDown(self):
        frappe.db.rollback()  # MANDATORY — never omit
```

## Required test cases per class
- Happy path insert
- Required field missing → `frappe.ValidationError`
- Permission denied → `frappe.PermissionError`
- Submit and cancel (if submittable)

## Mock external HTTP (never call real APIs)
```python
from unittest.mock import patch, MagicMock

@patch("myapp.integrations.service.requests.Session")
def test_api_call(self, mock_sess):
    mock_sess.return_value.request.return_value = MagicMock(
        ok=True, json=lambda: {"id": "test123"})
    result = MyIntegration().create_order(1000)
    self.assertEqual(result["id"], "test123")
```

## Run commands
```bash
bench run-tests --app <app> --doctype "<DocType>" --verbose
bench run-tests --app <app> --coverage   # target 80%+
```

## Rules
- `frappe.db.rollback()` in `tearDown()` is mandatory — never omit
- Never `ignore_permissions=True` unless testing background task context
- Test names: `test_<action>_<scenario>`
- Coverage target: 80%+ for every changed module
