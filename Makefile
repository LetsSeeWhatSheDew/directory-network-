# ──────────────────────────────────────────────────────────────────
#  Project Green — Makefile
# ──────────────────────────────────────────────────────────────────
#  make seed    — insert dispensary data into Supabase
#  make deploy  — commit everything and push
#  make status  — health-check the live site + DB row count
#  make all     — seed → deploy → status
# ──────────────────────────────────────────────────────────────────

SHELL := /bin/bash
.PHONY: seed deploy status all

# Load .env.local into shell environment for targets that need it
include .env.local
export

SITE_URL ?= https://directory-network-eta.vercel.app
DATE := $(shell date +%Y-%m-%d)

# ── seed ──────────────────────────────────────────────────────────
seed:
	@echo "══════════════════════════════════════════════"
	@echo "  SEED: Inserting dispensaries into Supabase"
	@echo "══════════════════════════════════════════════"
	@node scripts/seed-dispensaries.mjs \
		&& echo "" && echo "✓ Seed complete" \
		|| (echo "✗ Seed failed" && exit 1)

# ── deploy ────────────────────────────────────────────────────────
deploy:
	@echo "══════════════════════════════════════════════"
	@echo "  DEPLOY: Committing and pushing to remote"
	@echo "══════════════════════════════════════════════"
	@git add -A \
		&& git commit -m "deploy: cannabis city pages + seed data ($(DATE))" \
		&& git push \
		&& echo "" && echo "✓ Deploy complete — pushed to remote" \
		|| (echo "✗ Deploy failed" && exit 1)

# ── status ────────────────────────────────────────────────────────
status:
	@echo "══════════════════════════════════════════════"
	@echo "  STATUS: Checking live site + DB"
	@echo "══════════════════════════════════════════════"
	@echo ""
	@echo "— Site health check —"
	@HTTP_CODE=$$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$(SITE_URL)"); \
	if [ "$$HTTP_CODE" = "200" ]; then \
		echo "  $(SITE_URL) → HTTP $$HTTP_CODE ✓"; \
	else \
		echo "  $(SITE_URL) → HTTP $$HTTP_CODE ✗ (may not be deployed yet)"; \
	fi
	@echo ""
	@echo "— Supabase row count —"
	@ROW_COUNT=$$(curl -s \
		-H "apikey: $(SUPABASE_SERVICE_KEY)" \
		-H "Authorization: Bearer $(SUPABASE_SERVICE_KEY)" \
		-H "Prefer: count=exact" \
		-I \
		"$(SUPABASE_URL)/rest/v1/master_listings?select=id" \
		2>/dev/null \
		| grep -i "content-range" \
		| sed 's/.*\///'); \
	if [ -n "$$ROW_COUNT" ]; then \
		echo "  master_listings: $$ROW_COUNT rows ✓"; \
	else \
		echo "  master_listings: could not fetch count ✗"; \
	fi
	@echo ""
	@echo "✓ Status check complete"

# ── all ───────────────────────────────────────────────────────────
all: seed deploy status
