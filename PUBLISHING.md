# Safe public release

The current source tree contains synthetic demo data and is suitable for a public snapshot. The existing Git history must not be published because older commits contain the original unsanitized demo content and a personal commit-author email.

## Recommended: create a clean repository

Run these commands from the current `busdispo` directory after reviewing the pending changes:

```bash
mkdir ../busdispo-public
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.angular' \
  --exclude='dist' \
  ./ ../busdispo-public/
cd ../busdispo-public
git init -b main
```

Before the first commit, copy your GitHub `noreply` address from **GitHub → Settings → Emails** and configure it only for the new repository:

```bash
git config user.email "YOUR_GITHUB_NOREPLY_ADDRESS"
git add .
git commit -m "feat: publish BusDispo demo"
```

Create a new empty public GitHub repository, then connect and push the clean snapshot. If GitHub CLI is installed, this can be done with:

```bash
gh repo create busdispo-public --public --source=. --remote=origin --push
```

Keep the original repository private. Do not change its visibility because its old commits are intentionally excluded from the clean snapshot.

## Checks before every public push

```bash
npm test -- --watch=false
npm run build
gitleaks git . --redact
```

If `gitleaks` is not installed, install it from its official release before the final push. Never commit real employee, customer, vehicle, route or operational data to the public demo repository.
