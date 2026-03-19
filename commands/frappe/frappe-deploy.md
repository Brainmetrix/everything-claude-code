# Frappe Deploy
Run a full pre-deployment checklist and generate deployment commands.

## Step 1: Identify Target from $ARGUMENTS
| Target | Action |
|--------|--------|
| `staging` | Run checklist, deploy to staging |
| `production` | Run full checklist + require explicit confirmation |
| `rollback` | Generate rollback commands only |
| No target given | Default to staging checklist |

## Step 2: Pre-Deployment Checklist (run in order, stop on failure)

### Check 1 — Tests Pass
```bash
bench run-tests --app <app> --verbose
```
**Pass condition:** 0 failures, 0 errors.
**Fail action:** Stop. Report which tests failed. Do not proceed.

### Check 2 — Security Scan
```bash
npx ecc-agentshield scan
```
**Pass condition:** No CRITICAL findings.
**Fail action:** Stop. List critical issues. Do not proceed.

Manual check — run these and report findings:
```bash
# Hardcoded secrets in git history
git log --all -p | grep -E "(api_key|secret|password)\s*=" | grep -v "get_password"

# SQL injection patterns
grep -rn 'db\.sql.*%s\|db\.sql.*f"' apps/<app>/<app>/
```

### Check 3 — Fixtures Committed
```bash
bench --site <site> export-fixtures --app <app>
git -C apps/<app> status apps/<app>/<app>/fixtures/
```
**Pass condition:** `git status` shows no uncommitted fixture changes.
**Fail action:** Commit fixtures first, then continue.

### Check 4 — Migration Dry-Run on Staging
```bash
bench --site <staging_site> migrate --verbose
```
**Pass condition:** Completes with no errors.
**Fail action:** Report error, fix patch/schema issue before production.

### Check 5 — No Pending Background Jobs
```bash
bench --site <site> show-pending-jobs
bench --site <site> doctor
```
**Pass condition:** Queue is empty or jobs are expected.

## Step 3: Deploy Commands (run in order)
```bash
# 1. Record current commit for rollback
git -C apps/<app> rev-parse HEAD > /tmp/rollback_<app>_$(date +%Y%m%d).txt

# 2. Pull latest code
cd ~/frappe-bench
git -C apps/<app> pull origin main

# 3. Install any new Python dependencies
pip install -e apps/<app> --quiet

# 4. Build assets
bench build --app <app> --production

# 5. Run migrations
bench --site <site> migrate

# 6. Clear cache
bench --site <site> clear-cache
bench --site <site> clear-website-cache

# 7. Restart services
sudo supervisorctl restart all
# OR: bench restart
```

## Step 4: Post-Deploy Verification (run immediately after)
```bash
# Watch error logs for 2 minutes
tail -f logs/frappe.log | grep -E "(Error|Critical|Traceback)" &
sleep 120; kill %1

# Verify scheduler running
bench --site <site> doctor

# Smoke test critical endpoint
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://<site>/api/method/<app>.api.health_check
# Expected: 200
```

## Step 5: Rollback (if post-deploy verification fails)
```bash
ROLLBACK_COMMIT=$(cat /tmp/rollback_<app>_<date>.txt)
git -C apps/<app> checkout $ROLLBACK_COMMIT
bench --site <site> migrate   # re-runs any rollback patches
bench build --app <app>
bench restart
```

## Step 6: Guardrails
Stop and ask if:
- Any Check 1–3 fails → do not generate production deploy commands until resolved
- Target is `production` and staging deploy was not done first → warn and ask to confirm
- `bench migrate` has pending patches that delete data → show the patch, ask for confirmation

## Recovery Strategies
| Situation | Action |
|-----------|--------|
| Test failure | Fix failing test, re-run suite, then re-check |
| Fixture uncommitted | Export, commit, push, then re-check |
| Migration patch error | Fix patch, re-run on staging first |
| Post-deploy 500 errors | Rollback immediately, diagnose in staging |
| Scheduler not starting | `bench --site <site> enable-scheduler`, then `bench restart` |

## Examples
```
/frappe-deploy staging
/frappe-deploy production
/frappe-deploy rollback
```
