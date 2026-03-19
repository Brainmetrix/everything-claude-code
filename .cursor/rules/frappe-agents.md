---
description: "Guide to Frappe specialist agents — when to use each of the 12 agents"
globs: ["**/*"]
alwaysApply: false
---

# Frappe Specialist Agents

## When to use which agent

| Task | Agent |
|------|-------|
| Plan a new feature | `frappe-planner` — blueprint before any code |
| Architectural decisions | `frappe-architect` — system design trade-offs |
| Before every commit/PR | `frappe-reviewer` — security + performance + conventions |
| Writing tests first | `frappe-tdd-guide` — RED→GREEN enforcement |
| Pre-deployment audit | `frappe-security-reviewer` — OWASP + A-F grade |
| Slow pages or APIs | `frappe-perf-agent` — N+1, missing indexes |
| DB queries and schema | `frappe-db-agent` — ORM, SQL, patches |
| Whitelisted API design | `frappe-api-agent` — security, permissions |
| Background jobs | `frappe-bg-agent` — RQ, queue selection |
| bench migrate failures | `frappe-migrate-agent` — patches, upgrades |
| Third-party integrations | `frappe-integrator` — settings→adapter→webhook |
| After shipping | `frappe-doc-agent` — docstrings, CHANGELOG |

## Recommended daily workflow

**New feature:**
```
frappe-planner → blueprint
frappe-tdd-guide → failing tests first
(implement)
frappe-reviewer → catch issues before commit
```

**Before deployment:**
```
frappe-security-reviewer → OWASP audit (B or above required)
frappe-doc-agent → update changelog
```
