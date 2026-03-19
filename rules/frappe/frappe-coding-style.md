# Frappe Coding Style

## Project identity
This is a Frappe Framework + ERPNext project.
- Backend: Python — Frappe controllers, whitelisted APIs, background jobs (RQ)
- Database: MariaDB via Frappe ORM
- Frontend: Frappe UI (Vue 3), Jinja2, Frappe Pages (www/), Desk client scripts
- Table naming: DocType `"Sales Order"` → `` `tabSales Order` ``

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
before_cancel()  → validate cancellation is allowed
on_cancel()      → reversal of on_submit actions
on_trash()       → before deletion
```

## ORM method hierarchy
- User-facing: `frappe.get_list()` — permission-aware
- Internal: `frappe.get_all()` — no permission check, background only
- Settings: `frappe.get_cached_doc()` — always cached, never `get_doc()`
- Single field update: `frappe.db.set_value()` — atomic, not `get_doc().save()`
- SQL: `frappe.db.sql()` with `%(key)s` params — only when ORM insufficient

## SQL safety — non-negotiable
```python
# CORRECT
frappe.db.sql("SELECT name FROM `tabCustomer` WHERE name = %(n)s", {"n": name})
# WRONG — SQL injection
frappe.db.sql(f"SELECT name FROM `tabCustomer` WHERE name = '{name}'")
```

## Error handling
```python
frappe.throw(_("Message with {0}").format(value))  # CORRECT
raise Exception("Message")                          # NEVER
```

## JavaScript (Desk client scripts)
- `setup()` — link field filters only
- `refresh()` — conditional buttons and field toggles
- Always use `__()` for user-facing strings
- Use `frappe.call()` for all API calls, never raw `fetch()`
- Use `flt()` not `parseFloat()` for currency fields
