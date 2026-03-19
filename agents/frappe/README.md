# Frappe & ERPNext Specialist Agents

12 specialist subagents for Frappe Framework and ERPNext development.
Built for the [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) plugin.

Maintained by [Brainmetrix](https://github.com/Brainmetrix).

---

## Agents

### Planning & Design (Opus — deep reasoning)

| Agent | When to use |
|-------|------------|
| `frappe-planner` | Before writing any non-trivial feature. Produces a full implementation blueprint with file list, step order, migration plan, and security checklist. |
| `frappe-architect` | When facing system design trade-offs — monolith vs modular, sync vs async, ERPNext extension strategy, multi-tenant design. |

### Code Quality (Sonnet — balanced quality + cost)

| Agent | When to use |
|-------|------------|
| `frappe-reviewer` | Before every commit or PR. Reviews for security, performance, and convention issues. Returns PASS / NEEDS WORK / BLOCKED verdict. |
| `frappe-tdd-guide` | At the start of any feature or bug fix. Writes failing tests first, guides implementation until tests pass. |
| `frappe-security-reviewer` | Before every production deployment. Full OWASP Top 10 audit in Frappe context. Returns A–F security grade. |

### Specialist Technical (Sonnet)

| Agent | When to use |
|-------|------------|
| `frappe-perf-agent` | When pages or APIs are slow. Finds N+1 queries, missing indexes, blocking HTTP handlers. |
| `frappe-db-agent` | For DB query review, schema design, ORM method selection, migration patches, indexing strategy. |
| `frappe-api-agent` | For designing, reviewing, or debugging whitelisted API endpoints and webhooks. |
| `frappe-bg-agent` | For background job design, RQ queue selection, diagnosing failed jobs, converting blocking code to async. |
| `frappe-migrate-agent` | For bench migrate failures, schema changes, data migration patches, ERPNext version upgrades. |
| `frappe-integrator` | For third-party integrations — full stack: Settings DocType, adapter, webhook, sync, tests. |

### Documentation (Haiku — fast, low-cost)

| Agent | When to use |
|-------|------------|
| `frappe-doc-agent` | After implementing a feature or fixing a bug. Updates docstrings, README, CHANGELOG. |

---

## Model Assignment

| Model | Agents | Why |
|-------|--------|-----|
| **Opus** | planner, architect | Deep reasoning for complex architectural decisions |
| **Sonnet** | reviewer, tdd-guide, security-reviewer, perf-agent, db-agent, api-agent, bg-agent, migrate-agent, integrator | Balanced quality + cost for technical tasks |
| **Haiku** | doc-agent | Fast, repetitive documentation tasks |

---

## Installation

```bash
# Global — available in all projects
mkdir -p ~/.claude/agents
cp agents/frappe/*.md ~/.claude/agents/
```

---

## Daily Workflow

**Starting a new feature:**
```
frappe-planner → produces implementation blueprint
frappe-tdd-guide → write failing tests first
(implement with Claude's help)
frappe-reviewer → catch issues before commit
```

**Before deployment:**
```
frappe-reviewer → code quality gate
frappe-security-reviewer → OWASP audit
frappe-doc-agent → update changelog and docs
```

**When something is slow:**
```
frappe-perf-agent → diagnose and fix
frappe-db-agent → query and index review
```

**Building an integration:**
```
frappe-architect → design the integration architecture
frappe-integrator → generate full integration stack
frappe-tdd-guide → write tests with mocked HTTP
frappe-security-reviewer → verify webhook security
```

---

## Agent Structure

Each agent follows the ECC pattern:
- YAML frontmatter: `name`, `description`, `model`, `tools`
- Phase-by-phase execution steps
- Detection tables for classifying input
- Fix loops with guardrails
- Hard rules that cannot be overridden

---

## Contributing

To add a new agent, create a `.md` file with YAML frontmatter:
```yaml
---
name: frappe-<specialist>
description: >
  One paragraph describing when to use this agent.
  Include specific trigger scenarios.
model: sonnet
tools: ["Read", "Grep", "Glob"]
---
```

Then write the system prompt body with numbered phases, detection tables, and hard rules.
