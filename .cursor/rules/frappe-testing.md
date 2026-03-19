---
description: "Frappe/ERPNext TDD workflow — test structure, tearDown rollback, mock HTTP"
globs: ["**/test_*.py", "**/*.py"]
alwaysApply: false
---

# Frappe Testing Rules

## TDD workflow — write the failing test first
1. Write failing test → `bench run-tests` → confirm RED
2. Write minimal implementation → confirm GREEN
3. Refactor → re-run → still GREEN

## Mandatory test structure
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

## Required cases per class
- Happy path insert
- Required field missing → `frappe.ValidationError`
- Permission denied → `frappe.PermissionError`
- Submit/cancel transition (if submittable)

## Mock external HTTP
```python
from unittest.mock import patch, MagicMock

@patch("myapp.integrations.service.requests.Session")
def test_call(self, mock_sess):
    mock_sess.return_value.request.return_value = MagicMock(
        ok=True, json=lambda: {"id": "test123"})
```

## Rules
- `frappe.db.rollback()` in `tearDown()` — mandatory, never omit
- Never call real third-party APIs in tests — always mock
- Coverage target: 80%+ for every changed module
- Run: `bench run-tests --app <app> --doctype "<DocType>" --verbose`
