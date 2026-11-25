# Make the morning deal read reliable (about 5 minutes, Matthew)

**Why:** the real-browser deal reader runs on GitHub Actions. GitHub's own scheduler started it 7–10 hours late every day Nov 22–25. On Green Wednesday morning nothing had run since 7:37 PM the night before. Claude started a run by hand at 2:04 PM.

The Vercel cron fires on time (about 3:39 AM Central daily). As of Nov 25 it also starts the GitHub reader, but only once it has a token.

## Steps

1. **Create the token on GitHub:** Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   - Name: `puffprice-dispatch`
   - Expiration: 1 year
   - Repository access: **Only select repositories** → `directory-network-`
   - Permissions → Repository → **Actions: Read and write**. Nothing else.
   - Generate, then copy the token.
2. **Save it in Vercel:** project → Settings → Environment Variables → add `GITHUB_DISPATCH_TOKEN` = the token, for Production.
3. **Redeploy** (Deployments → the latest → Redeploy), or wait for the next push.

## Check

The next morning, GitHub → Actions → "Rendered deal scrape" shows a `workflow_dispatch` run at about 3:40 AM Central. The Vercel cron's JSON response also includes `"rendered": "started"`.
