---
description: "Frappe/ERPNext git workflow — branch naming, commit format, fixture export checklist"
globs: ["**/*"]
alwaysApply: false
---

# Frappe Git Workflow

## Branch naming
```
feat/add-razorpay-reconciliation
fix/sales-order-credit-limit-on-submit
chore/export-customer-custom-fields
refactor/payment-handler-error-handling
```

## Commit format (Conventional Commits)
```
feat(payment): add Razorpay webhook signature verification
fix(sales-order): validate credit limit on submit not validate
chore(fixtures): export updated Custom Fields for Customer
refactor(bg-jobs): convert report generation to background job
test(api): add permission denial tests for customer portal
```

## Pre-commit checklist
```bash
# Always export fixtures if Custom Fields or config changed
bench --site <site> export-fixtures --app <app>
git add <app>/fixtures/

# Run tests
bench run-tests --app <app> --verbose

# Security scan
npx ecc-agentshield scan
```

## Rules
- Never commit to `main` directly — always branch + PR
- Always export fixtures before committing if Custom Fields, Workflows, or Print Formats changed
- Never commit `.env`, site configs, or credential files
