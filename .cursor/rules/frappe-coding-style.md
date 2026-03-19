---
description: "Frappe/ERPNext coding style — ORM hierarchy, controller lifecycle, JS patterns"
globs: ["**/*.py", "**/*.js", "**/*.vue", "**/*.html", "**/*.json"]
alwaysApply: true
---

# Frappe Coding Style

## Source integrity — absolute rules
- NEVER modify files inside `frappe/` or `erpnext/` directories
- ALL customisations live in the custom app via hooks, Custom Fields, and overrides
- Override ERPNext DocType behaviour → `doc_events` in `hooks.py` + handler in `handlers/`
- Override ERPNext JS → `doctype_js` in `hooks.py` + file in `public/js/overrides/`

## Python controller lifecycle — use the right hook
```
validate()       → every save — validation only, NO db.commit()
before_insert()  → new record, before DB write
after_insert()   → new record, after DB write
on_submit()      → submission — create downstream records
on_cancel()      → reversal of on_submit actions
on_trash()       → before deletion
```

## ORM method hierarchy
- User-facing data: `frappe.get_list()` — permission-aware
- Internal/background: `frappe.get_all()` — no permission check
- Settings/config: `frappe.get_cached_doc()` — always, never `get_doc()`
- Atomic single field: `frappe.db.set_value()` — not `get_doc().save()`
- SQL when ORM insufficient: `%(key)s` params only — never f-strings

## SQL safety — non-negotiable
```python
frappe.db.sql("WHERE name = %(n)s", {"n": name})  # CORRECT
frappe.db.sql(f"WHERE name = '{name}'")            # CRITICAL VIOLATION
```

## Error handling
```python
frappe.throw(_("Message {0}").format(val))  # CORRECT
raise Exception("Message")                  # NEVER
```

## JavaScript (Desk client scripts)
- `setup()` → link field filters only
- `refresh()` → conditional buttons, field visibility
- Always use `__()` for user-facing strings
- Use `frappe.call()` for API calls, never raw `fetch()`
- Use `flt()` not `parseFloat()` for number fields
