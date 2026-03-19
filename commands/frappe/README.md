# Frappe & ERPNext Custom Claude Code Commands

Custom slash commands for Frappe Framework and ERPNext development teams.
Built for the [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) plugin.

Maintained by [Brainmetrix](https://github.com/Brainmetrix).

---

## Commands (21 Total)

| Command | Purpose |
|---|---|
| `/frappe` | Master dispatcher — routes to the right command automatically |
| `/frappe-new` | Scaffold full DocType: .json + .py + .js + test file |
| `/frappe-api` | Create secure whitelisted API endpoints |
| `/frappe-hook` | Add doc_events, scheduled tasks, JS overrides to hooks.py |
| `/frappe-bg` | Create or convert to background jobs (RQ) |
| `/frappe-fix` | Debug tracebacks, build errors, RQ job failures |
| `/frappe-review` | Deep security + performance + convention code review |
| `/frappe-patch` | Idempotent data migration patches |
| `/frappe-test` | Write unit and integration tests (80%+ coverage) |
| `/frappe-integrate` | Full third-party integration scaffold |
| `/frappe-report` | Query + Script reports with filters and charts |
| `/frappe-fixture` | Export, import, audit fixtures |
| `/frappe-perf` | Diagnose N+1, slow queries, missing indexes |
| `/frappe-permission` | Roles, field-level permissions, user restrictions |
| `/frappe-notify` | Emails, desk alerts, WhatsApp/SMS notifications |
| `/frappe-vue` | Frappe UI Vue 3 components with frappe-ui |
| `/frappe-page` | www/ portal pages with Jinja + Python context |
| `/frappe-deploy` | Pre-deployment checklist and deployment commands |
| `/frappe-print` | Print formats, PDF generation, letter heads |
| `/frappe-dashboard` | Number cards, charts, custom dashboards |
| `/frappe-migrate` | Migration failures, schema changes, version upgrades |
| `/frappe-import` | Bulk data import from CSV/Excel with progress |
| `/frappe-workflow` | Multi-step approval workflows with notifications |
| `/frappe-script` | Client scripts for Frappe Desk forms (JS) |

---

## Installation

### Global (available in all projects)
```bash
mkdir -p ~/.claude/commands
cp commands/frappe/*.md ~/.claude/commands/
```

### Project-level (only for current Frappe app)
```bash
mkdir -p .claude/commands
cp commands/frappe/*.md .claude/commands/
```

---

## Usage Examples

```
/frappe-new Supplier Payment Reconciliation with amount, date, status fields
/frappe-api get all overdue invoices for customer portal with pagination
/frappe-hook on_submit Sales Order check credit limit and block if exceeded
/frappe-bg sync all pending orders to Shopify every hour
/frappe-fix TypeError: NoneType has no attribute customer in payment handler
/frappe-review integrations/razorpay.py
/frappe-workflow Purchase Order 3-level approval based on amount
/frappe-integrate Shiprocket for shipping label generation and tracking
/frappe-report Monthly GST Summary for filing with B2B and B2C breakup
/frappe-deploy production — full pre-deployment checklist
```

---

## Also Required

These files should be placed in your Frappe app:

- `CLAUDE.md` → `~/frappe-bench/apps/<your_app>/CLAUDE.md`
- `SKILL.md` → `~/.claude/skills/frappe-patterns/SKILL.md`

Both files are available in the root of this repo under `examples/frappe/`.

---

## Contributing

Found a pattern we should add? Open a PR with a new command file following
the same structure. Each command should have: Purpose, Input, Steps,
Output Format, and Examples sections.
