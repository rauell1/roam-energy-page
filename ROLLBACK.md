# Roam Energy — Rollback Guide

> Step-by-step instructions to revert any bad deployment or commit.

---

## 1. Rollback a Vercel Deployment (fastest — no git needed)

Use this when the live site is broken but the code looks fine locally.

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select the **roam-energy-page** project
3. Click **Deployments** in the left sidebar
4. Find the last known-good deployment (green checkmark)
5. Click the **⋯ menu** → **Promote to Production**
6. Confirm — live site reverts in ~10 seconds

---

## 2. Revert a Single Commit (safe, non-destructive)

Creates a new commit that undoes the changes. Preferred for shared branches.

```bash
# Find the bad commit hash
git log --oneline -10

# Create a revert commit
git revert <commit-hash>

# Push to trigger a new Vercel deployment
git push origin main
```

---

## 3. Hard Reset to a Previous Commit (destructive — local only)

Use only if you need to completely discard recent local work.

```bash
# Find the target commit
git log --oneline -10

# Reset (discards all changes after this commit)
git reset --hard <commit-hash>

# Force push — WARNING: rewrites remote history
# Only do this if you are the sole contributor or have team approval
git push --force origin main
```

---

## 4. Restore a Single File to a Previous Version

```bash
# Restore a file to its state at a specific commit
git checkout <commit-hash> -- "Energy V1/index.html"

# Stage and commit the restoration
git add "Energy V1/index.html"
git commit -m "restore: revert index.html to <commit-hash>"
git push origin main
```

---

## 5. Emergency: Restore from the Pre-Revamp Snapshot

The commit hash recorded before the major revamp is stored in `REVERTED_COMMIT.md`.

```bash
cat REVERTED_COMMIT.md

# Then restore all frontend files:
git checkout <snapshot-hash> -- "Energy V1/"
git add "Energy V1/"
git commit -m "restore: revert to pre-revamp snapshot"
git push origin main
```

---

## 6. Rollback API Only (checkout function)

```bash
# Restore just the API layer
git checkout <last-good-hash> -- api/
git add api/
git commit -m "restore: revert api/ to <last-good-hash>"
git push origin main
```

---

## 7. Environment Variable Issues

If the API returns 500/502 errors after a deployment:

1. Go to **Vercel Dashboard → Project → Settings → Environment Variables**
2. Verify all required vars are set (see `CLAUDE.md` → Environment Variables table)
3. After editing env vars, trigger a **Redeploy** (no code change needed):
   - Deployments → Latest → ⋯ → Redeploy

---

## Recovery Checklist

| Step | Command / Action |
|------|-----------------|
| Identify bad commit | `git log --oneline -20` |
| Check live site | https://roam-energy.vercel.app |
| Check Vercel build logs | Vercel Dashboard → Deployments → Click deployment |
| Revert commit (safe) | `git revert <hash> && git push` |
| Promote old deployment | Vercel Dashboard → Deployments → Promote |
| Restore single file | `git checkout <hash> -- <file>` |
| Restore full frontend | `git checkout <hash> -- "Energy V1/"` |

---

## Commit History Reference

```bash
# View last 20 commits with dates
git log --oneline --decorate --graph -20

# View changes in a specific commit
git show <hash>

# Compare two commits
git diff <hash-a>..<hash-b> -- "Energy V1/"
```

---

*Last reviewed: 2025-05-17*
