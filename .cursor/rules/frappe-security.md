---
description: "Frappe/ERPNext security — has_permission, SQL injection, credential storage, webhook verification"
globs: ["**/*.py"]
alwaysApply: true
---

# Frappe Security Rules

## API endpoints — mandatory pattern
```python
@frappe.whitelist()
def endpoint(param):
    frappe.has_permission("DocType", throw=True)  # ALWAYS first, NEVER skip
    if not param:
        frappe.throw(_("param is required"))
    return frappe.get_list("DocType", filters={"f": param}, page_length=50)
```

## Guest endpoints
- `allow_guest=True` MUST verify signature/token before ANY processing
- Use `hmac.compare_digest()` — never `==` (timing attack risk)

## SQL injection — zero tolerance
```python
frappe.db.sql("WHERE name = %(n)s", {"n": name})  # CORRECT
frappe.db.sql(f"WHERE name = '{name}'")            # CRITICAL VIOLATION
```

## Credential storage
- Secrets MUST use `Password` fieldtype — encrypted at rest
- Retrieve: `settings.get_password("field_name")` — never direct attribute

## Transaction safety
- NEVER `frappe.db.commit()` inside `validate()` or any lifecycle hook
- Commit only in background tasks and patches

## Checklist before every PR
- [ ] Every `@frappe.whitelist()` has `frappe.has_permission()` as first call
- [ ] No SQL string interpolation in any changed file
- [ ] Secrets use Password fieldtype, retrieved via `get_password()`
- [ ] Webhook handlers verify signature before processing
- [ ] `allow_guest=True` endpoints have explicit validation
- [ ] `frappe.get_list()` for user-facing data (not `get_all()`)
