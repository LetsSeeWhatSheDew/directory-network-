#!/bin/zsh
# Nightly real-browser deal scrape (launchd: com.puffprice.rendered-scrape).
# Logs to ~/Library/Logs/puffprice-rendered-scrape.log
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "/Users/matthew/Desktop/ACTIVE/Directory-Network/Project - Directory/project-green" || exit 1
echo "=== $(date) ==="
npx -y tsx scripts/scrape-rendered-deals.ts --apply
echo "exit $?"
