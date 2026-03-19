# Frappe Master Dispatcher
Route any Frappe/ERPNext task to the correct specialist command and execute it.

## Step 1: Load Project Context
Read these files before anything else:
| File | Purpose |
|------|---------|
| `CLAUDE.md` (project root) | App name, site name, conventions |
| `hooks.py` | Current event bindings, scheduled tasks |
| `apps/<app>/modules.txt` | Module list |

## Step 2: Classify the Task from $ARGUMENTS
| Keyword in $ARGUMENTS | Execute Command |
|----------------------|-----------------|
| `new doctype` / `create doctype` / `scaffold` | `/frappe-new` |
| `api` / `endpoint` / `whitelist` | `/frappe-api` |
| `hook` / `doc_event` / `scheduled` / `cron` | `/frappe-hook` |
| `background` / `bg` / `enqueue` / `async` | `/frappe-bg` |
| `fix` / `error` / `traceback` / `exception` | `/frappe-fix` |
| `review` / `audit` / `check` | `/frappe-review` |
| `patch` / `migration` / `migrate data` | `/frappe-patch` |
| `fixture` / `export` / `import config` | `/frappe-fixture` |
| `test` / `unittest` / `spec` | `/frappe-test` |
| `integrate` / `integration` / `third-party` | `/frappe-integrate` |
| `report` / `query report` / `script report` | `/frappe-report` |
| `slow` / `performance` / `optimize` / `n+1` | `/frappe-perf` |
| `permission` / `role` / `access` | `/frappe-permission` |
| `notify` / `email` / `alert` / `whatsapp` | `/frappe-notify` |
| `vue` / `frappe-ui` / `component` | `/frappe-vue` |
| `page` / `www` / `portal` / `jinja` | `/frappe-page` |
| `deploy` / `production` / `release` | `/frappe-deploy` |
| `print format` / `pdf` / `letter head` | `/frappe-print` |
| `dashboard` / `chart` / `kpi` / `number card` | `/frappe-dashboard` |
| `bench migrate` / `schema` / `upgrade` | `/frappe-migrate` |
| `import data` / `bulk import` / `csv` | `/frappe-import` |
| `workflow` / `approval` / `state machine` | `/frappe-workflow` |
| `client script` / `form script` / `desk js` | `/frappe-script` |

## Step 3: Execute
Run the matched command with the full $ARGUMENTS passed through.

## Step 4: Guardrails
Stop and ask ONE clarifying question if:
- $ARGUMENTS is empty or fewer than 3 words
- The task spans more than 2 command categories (split into separate tasks)
- The task requires modifying `frappe/` or `erpnext/` source directly → explain the correct override approach instead

## Mandatory Rules (apply to all commands)
- NEVER modify `frappe/` or `erpnext/` core source
- NEVER use string interpolation in SQL — always parametrized queries
- NEVER call `frappe.db.commit()` inside `validate()` or lifecycle hooks
- NEVER block HTTP requests with heavy processing — always `enqueue()`
- ALWAYS call `frappe.has_permission()` in whitelisted APIs
- ALWAYS wrap user-facing strings in `_()`
