# Frappe Code Review
Review Frappe/ERPNext code for security, performance, and convention issues.

## Step 1: Identify Target from $ARGUMENTS
| Input | Action |
|-------|--------|
| File path given | Read that file directly |
| DocType name given | Read `doctype/<name>/` folder (all 4 files) |
| Module name given | Read all `.py` files in that module |
| `recent` or no path | Run `git diff HEAD~1 --name-only`, read changed files |
| `all` or app name | Read `api/`, `handlers/`, `integrations/` folders |

Read the target files before running any checklist.

## Step 2: Security Scan (run first — blocks deployment)
For each file read, check every item:

| Check | Pattern to Find | Severity |
|-------|----------------|----------|
| SQL injection | `f"SELECT"` or `%s` with variable | 🔴 CRITICAL |
| Missing permission check | `@frappe.whitelist()` without `frappe.has_permission()` | 🔴 CRITICAL |
| Unvalidated guest endpoint | `allow_guest=True` without signature check | 🔴 CRITICAL |
| Hardcoded secret | `api_key =`, `password =`, `secret =` literals | 🔴 CRITICAL |
| Commit in validate | `frappe.db.commit()` inside `validate()` | 🔴 CRITICAL |
| XSS in template | User input rendered without `escape_html()` | 🔴 CRITICAL |
| Missing rollback in test | `tearDown` without `frappe.db.rollback()` | 🟡 HIGH |

## Step 3: Performance Scan
| Check | Pattern to Find | Severity |
|-------|----------------|----------|
| N+1 query | `frappe.get_doc()` inside a loop | 🟡 HIGH |
| Unbounded list | `frappe.get_list()` without `page_length` | 🟡 HIGH |
| Blocking HTTP | Heavy logic in `@frappe.whitelist()` without `enqueue()` | 🟡 HIGH |
| Uncached settings | `frappe.get_doc("Settings")` repeatedly | 🟠 MEDIUM |
| Unindexed filter | Filtering on high-cardinality field with no index | 🟠 MEDIUM |
| Raw SQL over ORM | `frappe.db.sql()` where `frappe.get_list()` would work | 🟠 MEDIUM |

## Step 4: Convention Scan
| Check | Pattern to Find | Severity |
|-------|----------------|----------|
| Direct core edit | Import from or edit of `frappe/` or `erpnext/` | 🔴 CRITICAL |
| Untranslated string | User-facing string without `_()` wrapper | 🟠 MEDIUM |
| Bare raise | `raise Exception(` instead of `frappe.throw(` | 🟠 MEDIUM |
| Hardcoded site | `"mysite.localhost"` instead of `frappe.local.site` | 🟠 MEDIUM |
| Missing set_user | Background task without `frappe.set_user()` | 🟡 HIGH |
| Non-idempotent patch | Patch without existence/column check guard | 🟡 HIGH |
| Uncommitted fixtures | Custom Field changes not in `fixtures/` | 🟠 MEDIUM |

## Step 5: Output Format
For each finding output exactly:
```
🔴 CRITICAL | <file>:<line> | <problem in one sentence>
Fix: <code snippet or command>

🟡 HIGH | <file>:<line> | <problem>
Fix: <code snippet>

🟠 MEDIUM | <file>:<line> | <problem>
Fix: <suggestion>
```

## Step 6: Summary Score
```
Files reviewed: N
Critical issues: X  ← any = BLOCKED
High issues:    X  ← any = NEEDS WORK
Medium issues:  X  ← PASS with notes

Verdict: PASS | NEEDS WORK | BLOCKED
```
- **BLOCKED** → any 🔴 CRITICAL found — do not deploy
- **NEEDS WORK** → only 🟡 HIGH — fix before next sprint
- **PASS** → only 🟠 MEDIUM or lower — safe to merge

## Step 7: Guardrails
Stop and ask if:
- More than 10 critical issues found → likely a systemic problem, ask if full security audit is needed
- File is a core Frappe/ERPNext file → do not review, explain they should not be modifying it

## Examples
```
/frappe-review integrations/razorpay.py
/frappe-review api/customer_portal.py
/frappe-review recent
/frappe-review handlers/sales_order.py
```
