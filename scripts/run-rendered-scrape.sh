#!/bin/zsh
# Nightly real-browser deal scrape (launchd: com.puffprice.rendered-scrape).
# Runs from a dedicated clone at ~/puffprice-scraper — launchd jobs can't read
# ~/Desktop (macOS privacy protection), so the job never touches the working copy.
# Logs to ~/Library/Logs/puffprice-rendered-scrape.log
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.." || exit 1
echo "=== $(date) === $(pwd)"
git pull -q --ff-only origin main && npm install --include=dev --no-audit --no-fund --silent
npx tsx scripts/scrape-rendered-deals.ts --apply
echo "exit $?"
