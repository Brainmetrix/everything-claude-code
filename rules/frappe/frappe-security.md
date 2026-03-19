# Frappe Security Rules

## API endpoints — mandatory pattern
```python
@frappe.whitelist()
def my_endpoint(param):
    frappe.has_permission("DocType", throw=True)  # ALWAYS first
    if not param:
        frappe.throw(_("param is required"))
    return frappe.get_list("DocType", filters={"f": param}, page_length=50)
```

## Guest endpoints — extra requirements
- `allow_guest=True` MUST have signature or token verification before ANY processing
- Use `hmac.compare_digest()` for signature comparison — never `==`

## SQL injection — zero tolerance
```python
# CORRECT
frappe.db.sql("WHERE name = %(n)s", {"n": name})
# CRITICAL VIOLATION
frappe.db.sql(f"WHERE name = '{name}'")
```

## Credential storage
- Secrets MUST use `Password` fieldtype (encrypted at rest)
- Retrieve via `settings.get_password("field_name")` — never direct attribute

## Permission model
- `frappe.get_list()` → respects permissions → user-facing APIs
- `frappe.get_all()` → bypasses permissions → internal/background only
- `frappe.flags.ignore_permissions = True` → ONLY in migrations or test setup

## Transaction safety
- NEVER `frappe.db.commit()` inside `validate()` or any lifecycle hook
- Commit only in background tasks and patches

## Security checklist (before every PR)
- [ ] Every `@frappe.whitelist()` has `frappe.has_permission()` as first call
- [ ] No SQL string interpolation anywhere
- [ ] Secrets in Password fieldtype, retrieved via `get_password()`
- [ ] Webhook handlers verify signature before processing
- [ ] `allow_guest=True` endpoints have explicit validation
- [ ] `frappe.get_list()` used for user-facing data (not `get_all()`)
