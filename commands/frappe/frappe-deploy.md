# /frappe-deploy — Production Deployment Checklist & Commands

## Purpose
Run a full pre-deployment checklist, generate deployment commands,
and verify production readiness for Frappe/ERPNext apps.

## Input
$ARGUMENTS = deployment target (staging/production) or specific concern

## Pre-Deployment Checklist (run in order)

### 1. Code Quality
```bash
# Run full test suite — must pass 100%
bench run-tests --app <app> --verbose

# Check test coverage
bench run-tests --app <app> --coverage
# Open htmlcov/index.html — must be 80%+
```

### 2. Security Scan
```bash
# ECC AgentShield
npx ecc-agentshield scan

# Manual checks:
# - No hardcoded credentials in git history
# - All API endpoints have has_permission()
# - No allow_guest=True without signature check
# - SQL queries all parametrized
git log --all -p | grep -E "(api_key|secret|password)\s*=" | grep -v "get_password"
```

### 3. Fixtures & Migrations
```bash
# Export latest fixtures
bench --site <site> export-fixtures --app <app>
git status  # should be clean or only fixture changes

# Dry-run migration on staging first
bench --site staging.site migrate --skip-failing
bench --site staging.site run-patches
```

### 4. Performance
```bash
# Check for slow queries in logs
grep "Query took" logs/frappe.log | sort -t: -k2 -rn | head -20

# Check scheduler health
bench --site <site> doctor

# Check worker queues
bench --site <site> show-pending-jobs
```

### 5. Production Deployment Commands
```bash
# Pull latest code
cd ~/frappe-bench
git -C apps/<app> pull origin main

# Install dependencies if package.json changed
cd apps/<app> && pip install -e . --quiet

# Build assets
bench build --app <app> --production

# Run migrations
bench --site <site> migrate

# Clear cache
bench --site <site> clear-cache
bench --site <site> clear-website-cache

# Restart services
sudo supervisorctl restart all
# or
bench restart
```

### 6. Post-Deployment Verification
```bash
# Check error logs immediately after deploy
tail -f logs/frappe.log | grep -E "(Error|Critical|Traceback)"

# Verify scheduler is running
bench --site <site> doctor

# Test critical endpoints manually
curl -X POST https://<site>/api/method/<app>.api.health_check
```

## Rollback Plan (always prepare before deploying)
```bash
# Note current commit before deploying
git -C apps/<app> rev-parse HEAD > /tmp/rollback_commit.txt

# Rollback if needed
git -C apps/<app> checkout $(cat /tmp/rollback_commit.txt)
bench --site <site> migrate  # runs any rollback patches
bench build --app <app>
bench restart
```

## Output
1. Full checklist with pass/fail status for each item
2. Deployment command sequence for your specific setup
3. Rollback plan

## Examples
```
/frappe-deploy staging — run full checklist before pushing to staging
/frappe-deploy production — final checklist before go-live
/frappe-deploy rollback — steps to revert last deployment
/frappe-deploy what checks are failing before I can deploy
```
