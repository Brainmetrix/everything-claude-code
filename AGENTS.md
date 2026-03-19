# Brainmetrix — Frappe & ERPNext Agent Guide

This repository is a fork of [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
extended with specialist agents, commands, rules, skills, and Cursor hooks
for Frappe Framework and ERPNext development.

Maintained by [Brainmetrix](https://github.com/Brainmetrix).

---

## Quick Install

```bash
git clone https://github.com/Brainmetrix/everything-claude-code.git
cd everything-claude-code

# Claude Code — agents, commands, rules, skill
mkdir -p ~/.claude/agents ~/.claude/commands ~/.claude/rules ~/.claude/skills/frappe-patterns
cp agents/frappe/*.md ~/.claude/agents/
cp commands/frappe/*.md ~/.claude/commands/
cp -r rules/frappe/* ~/.claude/rules/
cp skills/frappe-patterns/SKILL.md ~/.claude/skills/frappe-patterns/SKILL.md

# Copy CLAUDE.md to your Frappe app root
cp examples/frappe/CLAUDE.md ~/frappe-bench/apps/<your_app>/CLAUDE.md

# Cursor — no install needed, open repo and rules load automatically
```

---

## Frappe Specialist Agents (12)

Install to `~/.claude/agents/`. Files in `agents/frappe/`.

### Planning & Design — `model: opus`

| Agent | When to invoke |
|-------|---------------|
| `frappe-planner` | Before writing any non-trivial feature. Reads codebase, produces a full blueprint with file list, step order, migration plan, and security checklist. Reply "proceed" to start. |
| `frappe-architect` | System design decisions — sync vs async, ERPNext extension strategy, integration architecture, multi-tenant design. Produces an Architecture Decision Record. |

### Code Quality — `model: sonnet`

| Agent | When to invoke |
|-------|---------------|
| `frappe-reviewer` | Before every commit or PR. Three-phase scan: security → performance → conventions. Returns PASS / NEEDS WORK / BLOCKED with file:line references. |
| `frappe-tdd-guide` | Start of every feature or bug fix. Writes failing test first, confirms RED, guides to GREEN. Never writes implementation before test exists. |
| `frappe-security-reviewer` | Before every production deployment. OWASP Top 10 in Frappe context. Returns A–F security grade. Do not deploy below B. |

### Specialist Technical — `model: sonnet`

| Agent | When to invoke |
|-------|---------------|
| `frappe-perf-agent` | When pages or APIs are slow. Finds N+1, missing indexes, blocking HTTP. Generates EXPLAIN queries and fix code. |
| `frappe-db-agent` | DB query review, schema design, ORM method selection, migration patches, indexing strategy. |
| `frappe-api-agent` | Whitelisted endpoint design, security audit, permission debugging. Generates endpoint + JS caller + unit test. |
| `frappe-bg-agent` | Background job design, RQ queue selection, failing job diagnosis. Generates `frappe.set_user("Administrator")` as first line. |
| `frappe-migrate-agent` | bench migrate failures, schema conflicts, idempotent patch creation, ERPNext version upgrades. |
| `frappe-integrator` | Full third-party integration stack: Settings DocType → adapter class → webhook handler → background sync → mocked tests. |

### Documentation — `model: haiku`

| Agent | When to invoke |
|-------|---------------|
| `frappe-doc-agent` | After shipping a feature. Updates docstrings, CHANGELOG, README. Fast and focused. |

---

## Daily Workflow

### Starting a new feature
```
frappe-planner      → blueprint and file list
frappe-tdd-guide    → write failing tests first
(implement)
frappe-reviewer     → catch issues before commit
```

### Before deploying
```
frappe-reviewer             → code quality gate
frappe-security-reviewer    → OWASP audit (B or above required)
frappe-doc-agent            → update CHANGELOG and docs
```

### When something is slow
```
frappe-perf-agent   → diagnose and generate fix
frappe-db-agent     → query and index review
```

### Building a third-party integration
```
frappe-architect    → design the integration architecture
frappe-integrator   → generate full integration stack
frappe-tdd-guide    → write tests with mocked HTTP
frappe-security-reviewer → verify webhook security
```

---

## Frappe Commands (24)

Install to `~/.claude/commands/`. Files in `commands/frappe/`.

| Command | Purpose |
|---------|---------|
| `/frappe` | Master dispatcher — routes to correct command |
| `/frappe-new` | Scaffold DocType: json + py + js + test |
| `/frappe-api` | Create whitelisted API endpoint |
| `/frappe-hook` | Add doc_events, scheduled tasks, JS overrides |
| `/frappe-bg` | Create or convert background job |
| `/frappe-fix` | Debug tracebacks and errors |
| `/frappe-review` | Deep Frappe-aware code review |
| `/frappe-patch` | Idempotent data migration patch |
| `/frappe-test` | Unit and integration tests |
| `/frappe-integrate` | Full third-party integration scaffold |
| `/frappe-report` | Query and Script reports |
| `/frappe-fixture` | Export, import, audit fixtures |
| `/frappe-perf` | Performance diagnosis |
| `/frappe-permission` | Roles and field-level permissions |
| `/frappe-notify` | Emails, desk alerts, WhatsApp/SMS |
| `/frappe-vue` | Frappe UI Vue 3 components |
| `/frappe-page` | www/ portal pages (Jinja + Python) |
| `/frappe-deploy` | Pre-deployment checklist |
| `/frappe-print` | Print formats and PDF generation |
| `/frappe-dashboard` | Dashboards and charts |
| `/frappe-migrate` | Migration failures and schema changes |
| `/frappe-import` | Bulk data import with progress |
| `/frappe-workflow` | Approval workflows |
| `/frappe-script` | Desk client scripts (JS) |

---

## Frappe Rules (Claude Code)

Install to `~/.claude/rules/`. Files in `rules/frappe/`.

```bash
cp -r rules/frappe/* ~/.claude/rules/
```

| Rule file | Always active for |
|-----------|------------------|
| `frappe-coding-style.md` | ORM hierarchy, lifecycle hooks, JS patterns |
| `frappe-security.md` | has_permission, SQL injection, credential storage |
| `frappe-testing.md` | TDD structure, tearDown rollback, mock HTTP |
| `frappe-performance.md` | N+1, page_length, cached_doc, enqueue |

---

## Cursor Support

The `.cursor/` folder provides full Cursor IDE support.
Open this repo in Cursor and rules load automatically — no install needed.

| Component | Count | Details |
|-----------|-------|---------|
| Rules | 6 | `frappe-coding-style`, `frappe-security`, `frappe-testing`, `frappe-performance`, `frappe-git-workflow`, `frappe-agents` — all with YAML frontmatter |
| Hook scripts | 4 | `adapter.js` (DRY bridge), `before-shell.js`, `after-file-edit.js`, `before-submit-prompt.js` |
| Hook events | 5 | `sessionStart`, `beforeShellExecution`, `afterFileEdit`, `beforeSubmitPrompt`, `stop` |
| Skill | 1 | `frappe-patterns` — auto-triggered on Frappe keywords |
| MCP config | 1 | `.cursor/mcp.json` — GitHub, Sequential Thinking, Memory |

### What the hooks do
- `beforeShellExecution` — blocks direct edits to `frappe/erpnext` source, blocks `git push --force`
- `afterFileEdit` — detects SQL injection, `commit()` in `validate()`, N+1 patterns live on save
- `beforeSubmitPrompt` — blocks prompts containing Razorpay keys, GitHub tokens, AWS keys
- `stop` — prints action item checklist (export fixtures, run migrate, run tests)

---

## Frappe Context Files

| File | Where to place | Purpose |
|------|---------------|---------|
| `examples/frappe/CLAUDE.md` | `~/frappe-bench/apps/<app>/CLAUDE.md` | Auto-loaded by Claude Code — app structure, CLI commands, conventions |
| `skills/frappe-patterns/SKILL.md` | `~/.claude/skills/frappe-patterns/SKILL.md` | Auto-triggered on Frappe keywords — 16 pattern areas |
| `.cursor/rules/*.md` | Already in repo `.cursor/` | Auto-loaded by Cursor — always-on Frappe rules |
