# /frappe-review — Deep Frappe-Aware Code Review

## Purpose
Review Frappe/ERPNext code for security, performance, convention violations,
and correctness. Deeper than generic /code-review because it knows
Frappe-specific anti-patterns.

## Input
$ARGUMENTS = file path, module, DocType name, or "recent" for git diff

## Review Checklist

### 🔴 Critical — Security / Data Loss (BLOCK deployment)
- [ ] SQL string interpolation anywhere → must be parametrized
- [ ] @frappe.whitelist() APIs missing frappe.has_permission()
- [ ] allow_guest=True without signature/token validation
- [ ] Passwords or secrets hardcoded in source
- [ ] frappe.db.commit() inside validate() or lifecycle hooks
- [ ] Missing rollback in exception handlers that modify DB
- [ ] File uploads without type/size validation
- [ ] XSS risk: user input rendered in Jinja without escape_html()

### 🟡 Performance — Fix This Sprint
- [ ] frappe.get_doc() inside a loop (N+1 query)
- [ ] frappe.get_list() without page_length limit
- [ ] Heavy sync work in HTTP request (should be enqueued)
- [ ] frappe.get_doc() for Settings/Single DocType (use get_cached_doc)
- [ ] Unindexed fields used as filters in large tables
- [ ] frappe.db.sql() used where ORM would work fine

### 🟠 Convention Violations — Fix This Sprint
- [ ] Modifying ERPNext/Frappe source directly
- [ ] User-facing strings not wrapped in _()
- [ ] raise Exception() instead of frappe.throw()
- [ ] Hardcoded site name instead of frappe.local.site
- [ ] Missing frappe.set_user() in background job function
- [ ] Patches that are not idempotent
- [ ] Fixtures not committed after Custom Field changes
- [ ] Missing frappe.db.rollback() in test tearDown()

### 🔵 Suggestions — Nice to Have
- [ ] Missing type hints on Python functions
- [ ] Missing docstrings on public API methods
- [ ] No tests for new controller logic
- [ ] Duplicate logic that could be extracted to utils/

## Output Format
Group by severity. For each finding:
- **File + line number**
- **Problem** (one sentence)
- **Fix** (code snippet if needed)

End with summary: `PASS / NEEDS WORK / BLOCKED`
- PASS = no red/yellow issues
- NEEDS WORK = yellow/orange only
- BLOCKED = any red issue found

## Examples
```
/frappe-review integrations/razorpay.py
/frappe-review api/customer_portal.py
/frappe-review handlers/sales_order.py
/frappe-review recent        (reviews files changed in last git commit)
/frappe-review myapp/        (reviews entire app)
```
