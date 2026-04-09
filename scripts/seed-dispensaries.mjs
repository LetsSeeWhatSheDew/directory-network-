#!/usr/bin/env node
/**
 * Seed dispensary listings into Supabase via REST API.
 *
 * Usage:
 *   node scripts/seed-dispensaries.mjs
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_KEY from .env.local
 * (or set them as environment variables).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Load .env.local ──────────────────────────────────────────────
const envPath = resolve(ROOT, ".env.local");
const envText = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

// ── Parse SQL seed file ──────────────────────────────────────────
const sql = readFileSync(
  resolve(ROOT, "sql/seed_illinois_dispensaries.sql"),
  "utf8"
);

const records = [];
// Match each VALUES tuple — tolerant of whitespace/newlines between fields
const re =
  /\(gen_random_uuid\(\),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(true|false)\)/gs;

let m;
while ((m = re.exec(sql)) !== null) {
  records.push({
    project_tag: m[1],
    listing_name: m[2],
    listing_title: m[3],
    listing_type: m[4],
    city: m[5],
    state: m[6],
    short_description: m[7],
    plan_tier: m[8],
    is_featured: m[9] === "true",
  });
}

console.log(`Parsed ${records.length} dispensary records from SQL file\n`);

// ── Insert via Supabase REST API ─────────────────────────────────
const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/master_listings`;

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=ignore-duplicates,return=representation",
  },
  body: JSON.stringify(records),
});

const body = await res.text();

if (!res.ok) {
  console.error(`ERROR ${res.status}: ${body}`);
  process.exit(1);
}

let inserted;
try {
  inserted = JSON.parse(body);
} catch {
  inserted = body;
}

const count = Array.isArray(inserted) ? inserted.length : "unknown";
console.log(`Done — ${count} records inserted (status ${res.status})`);

if (Array.isArray(inserted)) {
  const cities = [...new Set(inserted.map((r) => `${r.city}, ${r.state}`))];
  console.log(`\nCities seeded: ${cities.join(" · ")}`);
}
