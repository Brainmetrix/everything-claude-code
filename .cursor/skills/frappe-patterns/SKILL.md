---
name: frappe-patterns
description: >
  Frappe Framework and ERPNext development patterns. Use when working with
  DocTypes, controllers, hooks, whitelisted APIs, background jobs, client
  scripts, Jinja templates, Frappe Pages, Frappe UI (Vue 3), payment gateways,
  third-party integrations, fixtures, patches, or ERPNext customisations.
triggers:
  - frappe
  - erpnext
  - doctype
  - bench
  - hooks.py
  - frappe.whitelist
  - frappe.call
  - on_submit
  - on_cancel
  - frappe-ui
  - enqueue
  - fixtures
  - patches
  - mariadb frappe
---

# Frappe Framework & ERPNext — Cursor Skill

This skill is the Cursor-compatible mirror of `examples/frappe/SKILL.md`.
It covers all 16 Frappe pattern areas and is auto-triggered by the keywords
listed above in the frontmatter.

## Golden Rule
Never modify `frappe/` or `erpnext/` source. All customisations live in
your custom app via hooks, Custom Fields, and doc_events overrides.

## Key patterns covered

1. DocType controller lifecycle (validate → before_save → on_submit → on_cancel)
2. Whitelisted APIs with has_permission()
3. hooks.py — doc_events, scheduler_events, doctype_js
4. MariaDB ORM — get_list vs get_all vs db.sql
5. Background jobs — queue selection, enqueue(), frappe.set_user()
6. Client scripts — setup() vs refresh(), field triggers, child table events
7. Frappe UI (Vue 3) — createListResource, createDocumentResource, createResource
8. Frappe Pages (www/) — get_context(), no_cache, has_permission()
9. Patches — idempotency guards, parametrized SQL, commit
10. Fixtures — what to export, hooks.py fixtures list, export commands
11. Payment gateway integration — Settings DocType, adapter class, webhook
12. ERPNext customisation — doc_events vs Custom Script vs doctype_js
13. Security — has_permission, SQL injection, credential storage, signatures
14. Performance — N+1, page_length, cached_doc, enqueue vs block
15. Testing — make_test_records, tearDown rollback, mock HTTP
16. Common anti-patterns — commit in validate, ERPNext edits, blocking HTTP

## Full pattern reference
See `examples/frappe/SKILL.md` in this repository for complete code examples
covering all 16 areas.
