#!/bin/zsh
# Real-browser deal scrape (launchd: com.puffprice.rendered-scrape, 06:15 + 12:15).
# Runs from a dedicated clone at ~/puffprice-scraper — launchd jobs can't read
# ~/Desktop (macOS privacy protection), so the job never touches the working copy.
# Logs to ~/Library/Logs/puffprice-rendered-scrape.log
#
# Hang guard (2026-09-25): every step runs under a wall-clock limit. macOS has
# no GNU `timeout`, so run_with_timeout starts the command in its own process
# group (perl setpgrp + exec) and a watchdog kills the WHOLE group (npx → tsx
# → node → Chrome) with TERM, then KILL, when the limit passes. The scraper
# itself finalizes its scraper_runs row at 12 min and on SIGTERM; the 15 min
# limit here is the backstop if the node process is wedged.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.." || exit 1
echo "=== $(date) === $(pwd)"

run_with_timeout() {
  local secs=$1; shift
  perl -e 'setpgrp(0,0); exec @ARGV or die "exec failed: $!\n"' -- "$@" &
  local pid=$!
  (
    sleep "$secs"
    if kill -0 "$pid" 2>/dev/null; then
      echo "!!! timeout after ${secs}s: $* — killing process group $pid"
      kill -TERM -"$pid" 2>/dev/null
      sleep 20
      kill -KILL -"$pid" 2>/dev/null
    fi
  ) &
  local watchdog=$!
  wait "$pid"
  local rc=$?
  kill "$watchdog" 2>/dev/null
  pkill -P "$watchdog" 2>/dev/null   # the watchdog's sleep
  return $rc
}

# A previous run that is somehow still alive would fight this one for Chrome.
pkill -f "scripts/scrape-rendered-deals.ts" 2>/dev/null && echo "killed a leftover scrape process"

run_with_timeout 120 git pull -q --ff-only origin main || echo "git pull failed or timed out (continuing with current checkout)"
run_with_timeout 300 npm install --include=dev --no-audit --no-fund --silent || echo "npm install failed or timed out (continuing)"
run_with_timeout 900 npx tsx scripts/scrape-rendered-deals.ts --apply
echo "exit $?"
