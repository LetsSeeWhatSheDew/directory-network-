#!/usr/bin/env tsx
// scripts/il-license-registry-audit.ts
// =============================================================================
// Audits master_listings against the IDFPR "Active Adult Use Dispensing
// Organization Licenses" list — the authoritative Illinois state registry
// for adult-use cannabis dispensaries.
//
// Source:
//   https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf
//   (IDFPR = Illinois Department of Financial and Professional Regulation,
//   Division of Cannabis Regulation. The combined license list is updated
//   roughly quarterly; the currently-fetched copy is dated in its own header.)
//
// Produces three diff sets and writes a markdown report + a proposed migration.
// REPORT-ONLY. Does NOT write to Supabase. Does NOT apply the migration.
//
// Usage
//   npx tsx scripts/il-license-registry-audit.ts
//     — downloads PDF, extracts text via pdftotext, runs full audit
//   npx tsx scripts/il-license-registry-audit.ts --text=path/to/extracted.txt
//     — skip download + extraction; use a pre-extracted text file
//   npx tsx scripts/il-license-registry-audit.ts --pdf=path/to/local.pdf
//     — skip download; extract from a local PDF file
//
// Requirements
//   - SUPABASE_SERVICE_ROLE_KEY in env (read-only against master_listings).
//   - poppler installed for pdftotext (brew install poppler). Only needed
//     when pre-extracted text isn't provided via --text.
//
// Filter scope
//   Only dispensaries in the "Active Adult Use Dispensing Organization
//   Licenses" section of the PDF are parsed. The "Original Lottery
//   Conditional License List" and "SECL Conditional License List" sections
//   — which cover licenses that aren't yet operational — are intentionally
//   skipped. Our product is about live deals, so conditional licenses
//   without an active storefront shouldn't land in our DB.
// =============================================================================

import { argv, exit, env } from "node:process";
import { spawnSync } from "node:child_process";
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { dirname } from "node:path";

// ----------------------------- flags + constants -----------------------------

const TEXT_FLAG = argv.find((a) => a.startsWith("--text="))?.split("=")[1];
const PDF_FLAG = argv.find((a) => a.startsWith("--pdf="))?.split("=")[1];

const IDFPR_PDF_URL =
  "https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf";

const TMP_PDF = "tmp/il-audit/adultusedispensaries.pdf";
const TMP_TXT = "tmp/il-audit/adultusedispensaries.txt";

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY is not set. Required to read master_listings."
  );
  console.error(
    "       (Run `vercel env pull ../../../.env.local` or export it manually.)"
  );
  exit(1);
}

// ----------------------------- types -----------------------------------------

type StateRecord = {
  licenseHolder: string;
  dispensaryName: string;
  licenseNumber: string; // e.g. "284.000319-AUDO"
  issueDate: string;
  address1: string;
  city: string;
  state: "IL";
  postalCode: string;
  servesMedical: boolean; // noted in PDF via blue highlight; we can't detect
  quality: "clean" | "suspect";
  qualityReasons: string[]; // empty when quality === "clean"
  raw: string;
};

type Listing = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  address1: string | null;
  state: string | null;
  postal_code: string | null;
  license_number: string | null;
  is_active: boolean | null;
};

type MatchedPair = {
  state: StateRecord;
  db: Listing;
  nameMatch: boolean;
  addressMatch: boolean;
};

// ----------------------------- PDF source ------------------------------------

async function downloadPdf(url: string, outPath: string): Promise<void> {
  console.log(`  downloading PDF from ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download PDF: HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
  console.log(`  saved → ${outPath} (${buf.length.toLocaleString()} bytes)`);
}

function extractTextFromPdf(pdfPath: string, txtPath: string): void {
  console.log(`  extracting text via pdftotext -layout`);
  mkdirSync(dirname(txtPath), { recursive: true });
  const result = spawnSync("pdftotext", ["-layout", pdfPath, txtPath]);
  if (result.status !== 0) {
    throw new Error(
      `pdftotext failed (status=${result.status}). Install poppler: brew install poppler`
    );
  }
  console.log(`  saved → ${txtPath}`);
}

async function sourceLayoutText(): Promise<string> {
  if (TEXT_FLAG) {
    console.log(`  using pre-extracted text from ${TEXT_FLAG}`);
    return readFileSync(TEXT_FLAG, "utf8");
  }
  const pdfPath = PDF_FLAG || TMP_PDF;
  if (!existsSync(pdfPath)) {
    if (PDF_FLAG) {
      throw new Error(`--pdf path does not exist: ${PDF_FLAG}`);
    }
    await downloadPdf(IDFPR_PDF_URL, TMP_PDF);
  } else {
    console.log(`  using existing PDF at ${pdfPath}`);
  }
  extractTextFromPdf(pdfPath, TMP_TXT);
  return readFileSync(TMP_TXT, "utf8");
}

// ----------------------------- parse PDF text --------------------------------

// Column boundaries measured against the IDFPR layout output. If IDFPR
// reshapes the PDF, these will drift — re-measure with a couple of known
// records (Cookies - Peoria Heights on p. 11 is a good reference point).
const COL_HOLDER_END = 26;
const COL_NAME_END = 48;
const COL_ADDR_END = 82;
const COL_DATE_END = 96;

const CRED_RE = /(\d{3}\.\d{6,7}-AUDO)/;
const SECTION_START_RE = /Active Adult Use Dispensing Organization Licenses/;
// Tight match: the section-end header is its own line ("Original Lottery
// Conditional License List" with leading whitespace and nothing else). The
// page footer on every page also contains the phrase as part of a "Links to
// each document: ..." string — we must NOT break on those.
const SECTION_END_RE = /^\s*Original Lottery Conditional License List\s*$/;

function isNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true; // treat blank lines as noise for gap detection
  if (/^Links to each document:/.test(t)) return true;
  // Page-header row 1: "Address & Phone    License Issue    Adult Use Credential"
  if (/Address & Phone\b.*License Issue\b.*Adult Use Credential/.test(t)) return true;
  // Page-header row 2: "License Holder   Dispensary Name"
  if (/^License Holder\b[\s\S]*Dispensary Name/.test(t)) return true;
  // Page-header row 3: "Number   Date   Number"
  if (/^Number\b[\s\S]*Date\b[\s\S]*Number$/.test(t)) return true;
  // And individual-cell fragments when the pdftotext layout puts them
  // on their own lines.
  if (/^Address & Phone$/.test(t)) return true;
  if (/^License Issue$/.test(t)) return true;
  if (/^Adult Use Credential$/.test(t)) return true;
  if (/^Dispensaries highlighted in Blue/.test(t)) return true;
  if (/^Dispensaries that are BOLDED/.test(t)) return true;
  if (/^Total Number of Active/.test(t)) return true;
  if (/^idfpr\.illinois\.gov$/.test(t)) return true;
  if (/^JB PRITZKER/.test(t)) return true;
  if (/^Governor/.test(t)) return true;
  if (/^(MARIO|CAMILE|Secretary|Director)/.test(t)) return true;
  if (/^\d{1,3}$/.test(t)) return true; // isolated page numbers
  if (/^Updated:/.test(t)) return true;
  if (/^Combined License List$/.test(t)) return true;
  if (/^Table Of Contents$/.test(t)) return true;
  if (/^This document combines/.test(t)) return true;
  return false;
}

function sliceCol(line: string, start: number, end: number): string {
  const padded = line.padEnd(Math.max(end, 128));
  return padded.substring(start, end).trim();
}

function extractActiveSection(layoutText: string): string[] {
  const lines = layoutText.split("\n");
  const out: string[] = [];
  let inSection = false;
  let sawHeader = false;
  for (const line of lines) {
    // The Table of Contents repeats both section names. Only honor
    // section-start / section-end when the line ISN'T a dotted-leader TOC
    // entry ("Licenses......... 2" / "License List........... 22").
    const isToc = /\.{5,}/.test(line);
    if (sawHeader && SECTION_END_RE.test(line) && !isToc) break;
    if (SECTION_START_RE.test(line) && !isToc) {
      inSection = true;
      sawHeader = true;
      continue;
    }
    if (!inSection) continue;
    out.push(line);
  }
  if (!sawHeader) {
    throw new Error(
      "Could not locate 'Active Adult Use Dispensing Organization Licenses' section in PDF text."
    );
  }
  return out;
}

// US Postal Service street suffixes used to split a concatenated
// "street + city" string into its two parts. We scan for the LAST suffix
// match; everything after it is the city. Covers the suffixes that
// actually appear in the IDFPR list as of Jan 2026.
const STREET_SUFFIX_RE =
  /^(st|street|ave|avenue|blvd|boulevard|dr|drive|rd|road|pkwy|parkway|ln|lane|ct|court|pl|place|way|cir|circle|trl|trail|hwy|highway|plaza|sq|square|ter|terrace|crossing|xing|expressway|expy)\.?$/i;

function splitStreetAndCity(
  joined: string
): { street: string; city: string } {
  const tokens = joined.trim().split(/\s+/);
  let lastSuffixIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].replace(/[.,]$/, "");
    if (STREET_SUFFIX_RE.test(t)) lastSuffixIdx = i;
  }
  if (lastSuffixIdx < 0 || lastSuffixIdx === tokens.length - 1) {
    // No suffix found, or suffix is the very last token (no city after it).
    // Fall back to splitting on the last comma.
    const commaIdx = joined.lastIndexOf(",");
    if (commaIdx > 0) {
      return {
        street: joined.substring(0, commaIdx).trim(),
        city: joined.substring(commaIdx + 1).trim(),
      };
    }
    return { street: joined.trim(), city: "" };
  }
  // Extend street through any trailing unit / suite / apt tokens
  // ("Ste 101", "Suite B", "#103", "Unit 5") — these sit after the
  // street suffix but before the city. Also treat a lone single letter
  // after the street suffix as a unit designator (Sunnyside Champaign
  // has its address as "1704 S Neil St. C" where "C" is the unit).
  let cityStart = lastSuffixIdx + 1;
  while (cityStart < tokens.length) {
    const t = tokens[cityStart];
    if (/^#/.test(t)) {
      cityStart++;
      continue;
    }
    if (/^(ste|suite|unit|apt|apartment|bldg|building|rm|room|fl|floor)\.?$/i.test(t)) {
      cityStart++;
      if (cityStart < tokens.length && /^[A-Za-z0-9-]{1,5}$/.test(tokens[cityStart])) {
        cityStart++;
      }
      continue;
    }
    // Single-letter unit marker (e.g. "St. C Champaign") — only swallow
    // when the NEXT token still looks like a city. Prevents us from
    // eating a city that happens to start with a single letter.
    if (/^[A-Za-z]$/.test(t) && cityStart + 1 < tokens.length) {
      const nextT = tokens[cityStart + 1].replace(/[.,]$/, "");
      if (/^[A-Za-z][A-Za-z\-']{2,}/.test(nextT)) {
        cityStart++;
        continue;
      }
    }
    break;
  }
  const street = tokens.slice(0, cityStart).join(" ").replace(/,$/, "");
  const city = tokens
    .slice(cityStart)
    .join(" ")
    .replace(/^,\s*/, "")
    .replace(/,\s*$/, "")
    .trim();
  return { street, city };
}

function parseRecordFromBlock(block: string[]): StateRecord | null {
  let col1 = "";
  let col2 = "";
  let col3 = "";
  let col4 = "";
  let col5 = "";
  for (const line of block) {
    const c1 = sliceCol(line, 0, COL_HOLDER_END);
    const c2 = sliceCol(line, COL_HOLDER_END, COL_NAME_END);
    const c3 = sliceCol(line, COL_NAME_END, COL_ADDR_END);
    const c4 = sliceCol(line, COL_ADDR_END, COL_DATE_END);
    const c5 = sliceCol(line, COL_DATE_END, Math.max(line.length, 120));
    if (c1) col1 += (col1 ? " " : "") + c1;
    if (c2) col2 += (col2 ? " " : "") + c2;
    if (c3) col3 += (col3 ? " " : "") + c3;
    if (c4) col4 += (col4 ? " " : "") + c4;
    if (c5) col5 += (col5 ? " " : "") + c5;
  }

  const credMatch = col5.match(CRED_RE);
  if (!credMatch) return null;

  // Address column typically carries: "<street> <city>, IL <zip>[-<zip4>] [(<phone>)]"
  // Work from the right: find "IL <zip>" first, then everything to the
  // left of the zip is street + city (split on street-suffix). Phone on
  // a trailing sub-line gets stripped separately. Case-insensitive +
  // optional period after state abbreviation — some entries wrote it as
  // "Il." instead of "IL".
  let city = "";
  let postalCode = "";
  let address1 = col3;
  // Some PDF records wrap the zip4 in a way that drops a stray "1" (or
  // similar single digit) between the state and the 5-digit zip. Allow
  // it. Example: "Arlington Heights, IL 1 60005".
  const zipRe = /(?:IL|Illinois)\.?\s+(?:\d\s+)?(\d{5})(?:-\d{4})?/i;
  const zm = col3.match(zipRe);
  if (zm) {
    postalCode = zm[1];
    const leftOfState = col3.substring(0, zm.index!).replace(/,\s*$/, "").trim();
    const { street, city: parsedCity } = splitStreetAndCity(leftOfState);
    address1 = street;
    city = parsedCity;
    // If the city didn't come through (e.g. "Naperville" with no
    // street suffix and no comma), fall back to the string left after
    // stripping a plausible street (number + tokens).
    if (!city && /,/.test(leftOfState)) {
      const parts = leftOfState.split(",");
      address1 = parts.slice(0, -1).join(",").trim();
      city = parts[parts.length - 1].trim();
    }
  }

  // Scrub any residual phone / zip4 fragments that were carried along.
  address1 = address1
    .replace(/\(\d{3}\)\s*\d{3}-?\d{4}/g, "")
    .replace(/\b\d{3}-\d{3}-\d{4}\b/g, "")
    .replace(/\b\d{3}-\d{4}\b/g, "")
    .replace(/-\d{4}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*$/, "")
    .trim();

  // Dispensary name normalization — leave the raw " - " structure intact
  // for display; downstream slug/display functions handle collapsing.
  const dispensaryName = col2.replace(/\s+/g, " ").trim();

  // Quality check. Records that don't parse cleanly stay in the REPORT but
  // are excluded from the auto-generated migration — pdftotext's column
  // heuristic occasionally mis-aligns runs of content across our fixed
  // column boundaries, and we don't want those half-parsed rows inserted.
  const reasons: string[] = [];
  if (!dispensaryName) reasons.push("empty dispensary name");
  if (
    dispensaryName &&
    !/^[A-Za-z][A-Za-z0-9\s\-\+\&\.'\u2018\u2019"\u201C\u201D\*–—\/]{1,}$/.test(
      dispensaryName
    )
  )
    reasons.push("dispensary name has unexpected characters");
  if (dispensaryName && /[()]/.test(dispensaryName))
    reasons.push("dispensary name contains parentheses (likely phone bleed)");
  if (!city) reasons.push("city not parsed");
  if (city && !/^[A-Za-z][A-Za-z\s\-\.'ï]+$/.test(city))
    reasons.push("city has unexpected characters");
  if (!address1) reasons.push("street address not parsed");
  if (address1 && !/^\d/.test(address1) && !/^[NSEW]\.?\s+\d/i.test(address1))
    reasons.push("street address does not start with a number");
  if (postalCode && !/^\d{5}$/.test(postalCode))
    reasons.push("postal code not 5 digits");
  if (!credMatch[1] || !/^\d{3}\.\d{6,7}-AUDO$/.test(credMatch[1]))
    reasons.push("license number malformed");
  const quality = reasons.length === 0 ? "clean" : "suspect";

  return {
    licenseHolder: col1.replace(/\s+/g, " ").trim(),
    dispensaryName,
    licenseNumber: credMatch[1],
    issueDate: col4.replace(/\s+/g, " ").trim(),
    address1,
    city,
    state: "IL",
    postalCode,
    servesMedical: false, // color annotation is lost in pdftotext output
    quality,
    qualityReasons: reasons,
    raw: block.join("\n"),
  };
}

function parseStateRecords(layoutText: string): StateRecord[] {
  const sectionLines = extractActiveSection(layoutText);

  // Build a parallel "clean" line array — noisy lines become empty strings
  // so the line indexing still aligns when we look at neighbors.
  const clean = sectionLines.map((l) => (isNoiseLine(l) ? "" : l));

  // Credential-line indices anchor each record.
  const credIndices: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    if (CRED_RE.test(clean[i])) credIndices.push(i);
  }

  const records: StateRecord[] = [];

  // For each credential line, build a block by taking all lines whose
  // index is closer to THIS credential than to the neighboring credentials.
  // Using ceil() for the midpoint means the tie-breaker line always goes
  // to the later record — which aligns with how PDF tables typically
  // layout data: a record's street tends to appear above the credential
  // and the city/zip below, so the "leak line" should belong to the next
  // record down.
  for (let k = 0; k < credIndices.length; k++) {
    const ci = credIndices[k];
    const prev = k === 0 ? -1 : credIndices[k - 1];
    const next =
      k === credIndices.length - 1 ? clean.length : credIndices[k + 1];

    const lo = k === 0 ? 0 : Math.ceil((prev + ci) / 2);
    const hi =
      k === credIndices.length - 1
        ? clean.length
        : Math.ceil((ci + next) / 2);

    const block = clean.slice(lo, hi).filter((l) => l.trim().length > 0);
    const rec = parseRecordFromBlock(block);
    if (rec) records.push(rec);
  }

  return records;
}

// ----------------------------- normalization ---------------------------------

function normalizeName(s: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-") // en/em dash → -
    .replace(/\*+/g, "") // drop trailing asterisks (Sunnyside* etc.)
    .replace(/[^\w\s-]/g, " ")
    .replace(/\b(llc|inc|ltd|corp|co|dispensary|dispensaries|cannabis|company|the|of)\b/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " ")
    .trim();
}

function normalizeCity(s: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddress(s: string): string {
  if (!s) return "";
  // Strip suite / unit / apt designators entirely — they add noise when
  // comparing to DB rows that may or may not carry them.
  let n = s
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\bsuite\s+[\w-]+/g, "")
    .replace(/\bste\s+[\w-]+/g, "")
    .replace(/\bunit\s+[\w-]+/g, "")
    .replace(/\bapt\s+[\w-]+/g, "")
    .replace(/\bfl(?:oor)?\s+[\w-]+/g, "");
  n = n
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bparkway\b/g, "pkwy")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\broad\b/g, "rd")
    .replace(/\bcourt\b/g, "ct")
    .replace(/\bplace\b/g, "pl")
    .replace(/\blane\b/g, "ln")
    .replace(/\bnorth\b/g, "n")
    .replace(/\bsouth\b/g, "s")
    .replace(/\beast\b/g, "e")
    .replace(/\bwest\b/g, "w")
    .replace(/\s+/g, " ")
    .trim();
  return n;
}

function normalizeLicense(lic: string | null | undefined): string {
  if (!lic) return "";
  return lic.replace(/\./g, "").toUpperCase().trim();
}

function slugFromStateRecord(rec: StateRecord): string {
  // Extract the brand portion (before the last " - " separator) and combine
  // with the canonical city. Mirrors existing slugs like "cookies-chicago".
  const parts = rec.dispensaryName.split(/\s[-\u2013\u2014]\s/);
  const brand = (parts[0] || rec.dispensaryName).replace(/\*+/g, "");
  const kebab = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const brandSlug = kebab(brand);
  const citySlug = kebab(rec.city);
  if (!citySlug) return brandSlug;
  if (!brandSlug) return citySlug;
  if (brandSlug.endsWith(`-${citySlug}`)) return brandSlug;
  return `${brandSlug}-${citySlug}`;
}

function displayNameFromState(rec: StateRecord): string {
  // Drop " - " separators so "Cookies - Peoria Heights" becomes the cleaner
  // "Cookies Peoria Heights" used in existing rows like "Cookies Chicago".
  return rec.dispensaryName
    .replace(/\s*[\u2013\u2014-]\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\*+/g, "")
    .trim();
}

// ----------------------------- DB fetch --------------------------------------

async function fetchListings(): Promise<Listing[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/master_listings` +
    `?select=id,slug,name,city,address1,state,postal_code,license_number,is_active` +
    `&state=eq.IL&project_tag=eq.green&limit=1000`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY as string,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fetchListings failed ${res.status}: ${t}`);
  }
  return (await res.json()) as Listing[];
}

// ----------------------------- matching --------------------------------------

function match(
  stateRecords: StateRecord[],
  listings: Listing[]
): {
  inStateNotInDb: StateRecord[];
  inDbNotInState: Listing[];
  mismatches: MatchedPair[];
  matched: MatchedPair[];
} {
  const dbByLicense = new Map<string, Listing>();
  for (const l of listings) {
    const norm = normalizeLicense(l.license_number);
    if (norm) dbByLicense.set(norm, l);
  }

  // Name + city index; multiple listings can share a brand-in-city.
  const dbByNameCity = new Map<string, Listing[]>();
  for (const l of listings) {
    const k = `${normalizeName(l.name)}|${normalizeCity(l.city || "")}`;
    const arr = dbByNameCity.get(k) || [];
    arr.push(l);
    dbByNameCity.set(k, arr);
  }

  // Address + city index — second-pass fallback.
  const dbByAddrCity = new Map<string, Listing[]>();
  for (const l of listings) {
    const k = `${normalizeAddress(l.address1 || "")}|${normalizeCity(l.city || "")}`;
    if (!k.startsWith("|")) {
      const arr = dbByAddrCity.get(k) || [];
      arr.push(l);
      dbByAddrCity.set(k, arr);
    }
  }

  const matchedDbIds = new Set<string>();
  const inStateNotInDb: StateRecord[] = [];
  const matched: MatchedPair[] = [];
  const mismatches: MatchedPair[] = [];

  for (const sr of stateRecords) {
    const srLicense = normalizeLicense(sr.licenseNumber);
    const srNameKey = `${normalizeName(sr.dispensaryName)}|${normalizeCity(sr.city)}`;
    const srAddrKey = `${normalizeAddress(sr.address1)}|${normalizeCity(sr.city)}`;

    let hit: Listing | null = null;

    if (srLicense && dbByLicense.has(srLicense)) {
      hit = dbByLicense.get(srLicense)!;
    }
    if (!hit) {
      const cand = dbByNameCity.get(srNameKey);
      if (cand && cand.length) hit = cand[0];
    }
    if (!hit) {
      const cand = dbByAddrCity.get(srAddrKey);
      if (cand && cand.length) hit = cand[0];
    }
    // Fuzzy fallback: brand prefix (first token of normalized name) + city.
    if (!hit) {
      const srBrand = normalizeName(sr.dispensaryName).split(" ")[0];
      const srCity = normalizeCity(sr.city);
      if (srBrand && srCity) {
        for (const l of listings) {
          if (matchedDbIds.has(l.id)) continue;
          if (normalizeCity(l.city || "") !== srCity) continue;
          const dbBrand = normalizeName(l.name).split(" ")[0];
          if (dbBrand && dbBrand === srBrand) {
            hit = l;
            break;
          }
        }
      }
    }
    // Final fallback — street number + city. Two dispensaries with the
    // same street number in the same IL city are almost certainly the
    // same business. Useful when the state PDF has a garbled name but
    // the address parsed cleanly.
    if (!hit) {
      const srStreetNum = (sr.address1.match(/^\d+/) || [])[0];
      const srCity = normalizeCity(sr.city);
      if (srStreetNum && srCity) {
        for (const l of listings) {
          if (matchedDbIds.has(l.id)) continue;
          if (normalizeCity(l.city || "") !== srCity) continue;
          const dbStreetNum = ((l.address1 || "").match(/^\d+/) || [])[0];
          if (dbStreetNum && dbStreetNum === srStreetNum) {
            hit = l;
            break;
          }
        }
      }
    }

    if (!hit) {
      inStateNotInDb.push(sr);
      continue;
    }
    matchedDbIds.add(hit.id);

    const nameMatch =
      normalizeName(hit.name).includes(normalizeName(sr.dispensaryName).split(" ")[0]) ||
      normalizeName(sr.dispensaryName).includes(normalizeName(hit.name).split(" ")[0]);
    const addressMatch =
      !hit.address1 ||
      !sr.address1 ||
      normalizeAddress(hit.address1) === normalizeAddress(sr.address1) ||
      normalizeAddress(sr.address1).startsWith(normalizeAddress(hit.address1).split(" ")[0]);

    const pair: MatchedPair = { state: sr, db: hit, nameMatch, addressMatch };
    matched.push(pair);
    if (!nameMatch || !addressMatch) mismatches.push(pair);
  }

  const inDbNotInState: Listing[] = listings.filter(
    (l) => !matchedDbIds.has(l.id)
  );

  return { inStateNotInDb, inDbNotInState, mismatches, matched };
}

// ----------------------------- output ----------------------------------------

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sqlEscape(s: string | null | undefined): string {
  if (s === null || s === undefined) return "NULL";
  return `'${s.replace(/'/g, "''")}'`;
}

function renderMarkdownReport(args: {
  stateTotal: number;
  matchedCount: number;
  newCount: number;
  orphanCount: number;
  mismatchCount: number;
  pdfUrl: string;
  pdfUpdated: string;
  inStateNotInDb: StateRecord[];
  inDbNotInState: Listing[];
  mismatches: MatchedPair[];
  newCities: string[];
}): string {
  const {
    stateTotal,
    matchedCount,
    newCount,
    orphanCount,
    mismatchCount,
    pdfUrl,
    pdfUpdated,
    inStateNotInDb,
    inDbNotInState,
    mismatches,
    newCities,
  } = args;

  const date = todayIsoDate();
  const lines: string[] = [];
  lines.push(`# Illinois License Registry Audit — ${date}`);
  lines.push("");
  lines.push("**Purpose:** compare `master_listings` against the authoritative IDFPR");
  lines.push("Active Adult Use Dispensing Organization Licenses list. Identify new");
  lines.push("dispensaries we're missing, listings we hold that the state no longer");
  lines.push("recognizes, and any data mismatches between the two.");
  lines.push("");
  lines.push("**This report is read-only.** A proposed migration accompanies this");
  lines.push("document; Matthew reviews and applies. No DB writes happen during the");
  lines.push("audit itself.");
  lines.push("");
  lines.push("## Source");
  lines.push("");
  lines.push(`- **Authority:** Illinois Department of Financial and Professional Regulation (IDFPR), Division of Cannabis Regulation`);
  lines.push(`- **Document:** Active Adult Use Dispensing Organization Licenses`);
  lines.push(`- **URL:** ${pdfUrl}`);
  lines.push(`- **PDF "Updated:" header:** ${pdfUpdated || "(not detected — check the PDF)"}`);
  lines.push(`- **Format:** text-extractable PDF (multi-column table)`);
  lines.push(`- **Extraction:** \`pdftotext -layout\` → column slicing → credential-anchored record assembly`);
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(`| metric | count |`);
  lines.push(`|---|---|`);
  lines.push(`| State active adult-use licenses parsed | ${stateTotal} |`);
  lines.push(`| Matched to our DB | ${matchedCount} |`);
  lines.push(`| **IN_STATE_NOT_IN_DB** (new — propose ADD) | **${newCount}** |`);
  lines.push(`| **IN_DB_NOT_IN_STATE** (orphaned — propose REVIEW) | **${orphanCount}** |`);
  lines.push(`| **MISMATCH** (matched but fields differ — propose REVIEW) | **${mismatchCount}** |`);
  lines.push("");

  // ---- IN_STATE_NOT_IN_DB
  const newClean = inStateNotInDb.filter((r) => r.quality === "clean");
  const newSuspect = inStateNotInDb.filter((r) => r.quality === "suspect");

  lines.push("## IN_STATE_NOT_IN_DB — state-licensed, missing from DB");
  lines.push("");
  lines.push("These dispensaries hold an active IL adult-use license but don't");
  lines.push("appear in `master_listings`.");
  lines.push("");
  lines.push("The rows are split into two tiers by parse quality. **Clean** rows");
  lines.push("are included in the auto-generated migration. **Suspect** rows had");
  lines.push("column-alignment quirks in the PDF and are reported here only —");
  lines.push("Matthew should check them against the PDF directly before deciding");
  lines.push("whether to add them.");
  lines.push("");
  lines.push(`- **Clean (auto-migrated):** ${newClean.length}`);
  lines.push(`- **Suspect (manual review):** ${newSuspect.length}`);
  lines.push("");

  lines.push("### Clean — in the migration file");
  lines.push("");
  if (newClean.length === 0) {
    lines.push("_No clean new rows._");
    lines.push("");
  } else {
    lines.push("| proposed slug | dispensary name | city | address | zip | license |");
    lines.push("|---|---|---|---|---|---|");
    const sorted = [...newClean].sort((a, b) =>
      (a.city + a.dispensaryName).localeCompare(b.city + b.dispensaryName)
    );
    for (const sr of sorted) {
      const slug = slugFromStateRecord(sr);
      const name = displayNameFromState(sr);
      lines.push(
        `| \`${slug}\` | ${name} | ${sr.city} | ${sr.address1} | ${sr.postalCode} | ${sr.licenseNumber} |`
      );
    }
    lines.push("");
  }

  lines.push("### Suspect — manual review needed (NOT in migration)");
  lines.push("");
  if (newSuspect.length === 0) {
    lines.push("_No suspect rows. PDF parsed cleanly._");
    lines.push("");
  } else {
    lines.push("For each row below, the raw-parsed name / city / address are");
    lines.push("shown alongside the flag(s) that tripped the quality check. Open");
    lines.push("the PDF at the `license` number to verify the canonical values.");
    lines.push("");
    lines.push("| license | raw name | raw city | raw address | zip | flag(s) |");
    lines.push("|---|---|---|---|---|---|");
    const sorted = [...newSuspect].sort((a, b) =>
      a.licenseNumber.localeCompare(b.licenseNumber)
    );
    for (const sr of sorted) {
      lines.push(
        `| ${sr.licenseNumber} | \`${sr.dispensaryName || "—"}\` | \`${sr.city || "—"}\` | \`${sr.address1 || "—"}\` | ${sr.postalCode} | ${sr.qualityReasons.join("; ")} |`
      );
    }
    lines.push("");
  }

  // ---- New cities uncovered
  if (newCities.length > 0) {
    lines.push("### Downstream: new cities surfaced");
    lines.push("");
    lines.push("The dispensaries above include cities we don't yet have listings in.");
    lines.push("After the migration is applied, the Google Places logo + GPS");
    lines.push("backfill (`scripts/backfill-logos-from-google-places.ts`) should be");
    lines.push("re-run with `--cities=` that includes these:");
    lines.push("");
    for (const c of newCities) lines.push(`- ${c}`);
    lines.push("");
    lines.push("Whether any of these cities should enter `CENTRAL_IL_CITIES` (the");
    lines.push("homepage scope anchor) is a separate scope decision — not part of");
    lines.push("this audit.");
    lines.push("");
  }

  // ---- IN_DB_NOT_IN_STATE
  lines.push("## IN_DB_NOT_IN_STATE — in our DB, no matching state license");
  lines.push("");
  lines.push("These listings live in `master_listings` but we couldn't match them");
  lines.push("to a record in the IDFPR active-license list. Causes to investigate");
  lines.push("before taking action:");
  lines.push("");
  lines.push("- Match logic missed it (different name variant, typo in address). Check manually.");
  lines.push("- Dispensary is operating under a conditional (not-yet-active) license. Not in our scope until operational.");
  lines.push("- Dispensary closed or surrendered its license. Candidate for `is_active=false`.");
  lines.push("- Record is an aspirational seed (never opened). Candidate for deletion.");
  lines.push("");
  lines.push("**Do not mass-deactivate.** Matthew decides per row.");
  lines.push("");
  if (inDbNotInState.length === 0) {
    lines.push("_None. Every DB row matched a state record._");
    lines.push("");
  } else {
    lines.push("| slug | name | city | address | is_active | license_number |");
    lines.push("|---|---|---|---|---|---|");
    const sorted = [...inDbNotInState].sort((a, b) =>
      ((a.city || "") + a.name).localeCompare((b.city || "") + b.name)
    );
    for (const l of sorted) {
      lines.push(
        `| \`${l.slug}\` | ${l.name} | ${l.city || ""} | ${l.address1 || ""} | ${
          l.is_active === null ? "?" : l.is_active ? "true" : "false"
        } | ${l.license_number || ""} |`
      );
    }
    lines.push("");
  }

  // ---- MISMATCH
  lines.push("## MISMATCH — matched but name or address differs");
  lines.push("");
  lines.push("Records where the fuzzy matcher linked a DB row to a state row, but");
  lines.push("the name or address doesn't line up cleanly. Usually a data-freshness");
  lines.push("issue (the state updated, we haven't) or a wrong-match false positive.");
  lines.push("");
  if (mismatches.length === 0) {
    lines.push("_None. Matched pairs are internally consistent._");
    lines.push("");
  } else {
    lines.push("| slug | our name | state name | our address | state address | name ok | addr ok |");
    lines.push("|---|---|---|---|---|---|---|");
    for (const m of mismatches) {
      lines.push(
        `| \`${m.db.slug}\` | ${m.db.name} | ${displayNameFromState(m.state)} | ${
          m.db.address1 || ""
        } | ${m.state.address1} | ${m.nameMatch ? "✓" : "✗"} | ${m.addressMatch ? "✓" : "✗"} |`
      );
    }
    lines.push("");
  }

  // ---- Methodology
  lines.push("## Methodology");
  lines.push("");
  lines.push("1. **Source acquisition.** Downloads the IDFPR combined PDF, extracts text with");
  lines.push("   `pdftotext -layout` so column positions are preserved.");
  lines.push("2. **Section scoping.** Only the \"Active Adult Use Dispensing Organization");
  lines.push("   Licenses\" section is parsed — the Original Lottery / SECL conditional");
  lines.push("   license lists (dispensaries that haven't opened yet) are intentionally");
  lines.push("   skipped. Conditional licenses belong in our DB once they transition to");
  lines.push("   operational status, not before.");
  lines.push("3. **Record assembly.** Each record is anchored by its credential number");
  lines.push("   (regex `\\d{3}\\.\\d{6,7}-AUDO`). Lines within the nearest credential's");
  lines.push("   gravity are joined and split by column boundary (holder / name / address /");
  lines.push("   date / credential).");
  lines.push("4. **Normalization.**");
  lines.push("   - Names: lowercase, strip LLC/Inc/Dispensary/Cannabis/etc., collapse dashes, remove punctuation.");
  lines.push("   - Addresses: lowercase, expand street abbreviations (Avenue→Ave, etc.), collapse whitespace.");
  lines.push("   - License numbers: strip the period (`284.000319-AUDO` → `284000319-AUDO`) for comparison.");
  lines.push("   - Cities: lowercase + trim.");
  lines.push("5. **Matching (in priority order).**");
  lines.push("   - Exact normalized license-number match.");
  lines.push("   - Normalized name + city.");
  lines.push("   - Normalized address + city.");
  lines.push("   - Brand-first-token + city fuzzy fallback.");
  lines.push("");

  lines.push("## What to do next");
  lines.push("");
  lines.push("1. Review the IN_STATE_NOT_IN_DB list. For each row, confirm the state record");
  lines.push("   is accurate (the state PDF has data-entry errors from time to time) and that");
  lines.push("   the proposed slug matches our convention.");
  lines.push("2. Apply `sql/migrations/" + date + "-il-license-registry-sync.sql` via the");
  lines.push("   Supabase SQL Editor or MCP.");
  lines.push("3. Re-run the Google Places logo + GPS backfill with the new cities listed above.");
  lines.push("4. Walk the IN_DB_NOT_IN_STATE list with Matthew to decide per row: deactivate,");
  lines.push("   delete, or leave as-is with a research note.");
  lines.push("5. For MISMATCH rows, investigate which version is canonical (usually the state).");
  lines.push("");

  return lines.join("\n");
}

function renderMigration(
  newRecords: StateRecord[],
  reportDate: string
): string {
  const lines: string[] = [];
  lines.push(`-- sql/migrations/${reportDate}-il-license-registry-sync.sql`);
  lines.push(`-- NOT YET APPLIED — awaiting Matthew's review.`);
  lines.push(`--`);
  lines.push(`-- Generated by scripts/il-license-registry-audit.ts on ${reportDate}.`);
  lines.push(`-- Source: IDFPR Active Adult Use Dispensing Organization Licenses (PDF).`);
  lines.push(`-- See: docs/data-audit-${reportDate}-il-license-registry.md`);
  lines.push(`--`);
  lines.push(`-- This migration inserts ${newRecords.length} dispensaries that hold active`);
  lines.push(`-- IL adult-use licenses and are missing from our master_listings table.`);
  lines.push(`-- Logo / GPS are left NULL; the Google Places backfill script will`);
  lines.push(`-- enrich them after this migration is applied.`);
  lines.push(`--`);
  lines.push(`-- To apply:`);
  lines.push(`--   1) Review rows for accuracy (especially slug + address).`);
  lines.push(`--   2) Paste into the Supabase SQL Editor OR run via the Supabase MCP.`);
  lines.push(`--   3) After INSERT, run:`);
  lines.push(`--      npx tsx scripts/backfill-logos-from-google-places.ts \\`);
  lines.push(`--        --cities=<new-city-slugs-comma-separated> --live`);
  lines.push("");

  if (newRecords.length === 0) {
    lines.push("-- No new dispensaries found. This migration is a no-op placeholder.");
    lines.push("-- (Commit kept for traceability; delete the file if you'd rather not land it.)");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`BEGIN;`);
  lines.push("");
  lines.push(
    `INSERT INTO master_listings (`
  );
  lines.push(
    `  id, project_tag, type, name, slug, address1, city, state, postal_code, country,`
  );
  lines.push(
    `  license_number, license_state, is_active, created_at, updated_at`
  );
  lines.push(`) VALUES`);

  const rowStrs: string[] = [];
  const sorted = [...newRecords].sort((a, b) =>
    (a.city + a.dispensaryName).localeCompare(b.city + b.dispensaryName)
  );
  for (const r of sorted) {
    const slug = slugFromStateRecord(r);
    const name = displayNameFromState(r);
    rowStrs.push(
      `  (gen_random_uuid()::text, 'green', 'dispensary', ` +
        `${sqlEscape(name)}, ${sqlEscape(slug)}, ${sqlEscape(r.address1)}, ` +
        `${sqlEscape(r.city)}, 'IL', ${sqlEscape(r.postalCode || null)}, 'US', ` +
        `${sqlEscape(r.licenseNumber)}, 'IL', true, now(), now())`
    );
  }
  lines.push(rowStrs.join(",\n"));
  lines.push(`ON CONFLICT DO NOTHING;`);
  lines.push("");
  lines.push(`-- Sanity check: how many rows landed.`);
  lines.push(`-- SELECT count(*) FROM master_listings WHERE license_number IN (`);
  lines.push(
    `--   ${sorted
      .map((r) => sqlEscape(r.licenseNumber))
      .join(", ")}`
  );
  lines.push(`-- );`);
  lines.push("");
  lines.push(`COMMIT;`);
  lines.push("");
  return lines.join("\n");
}

function detectPdfUpdatedDate(layoutText: string): string {
  const m = layoutText.match(/Updated:\s*([A-Za-z]+ \d{1,2},\s*\d{4})/);
  return m ? m[1].trim() : "";
}

// ----------------------------- main ------------------------------------------

(async () => {
  console.log("");
  console.log("=== IL License Registry Audit ===");
  console.log("");

  console.log("[1/5] Source");
  const layoutText = await sourceLayoutText();
  const pdfUpdated = detectPdfUpdatedDate(layoutText);
  console.log(`  PDF "Updated:" header: ${pdfUpdated || "(not detected)"}`);

  console.log("");
  console.log("[2/5] Parse state records");
  const stateRecords = parseStateRecords(layoutText);
  console.log(`  parsed: ${stateRecords.length} active adult-use dispensaries`);

  console.log("");
  console.log("[3/5] Fetch master_listings (IL / project_tag='green')");
  const listings = await fetchListings();
  console.log(`  fetched: ${listings.length} rows`);

  console.log("");
  console.log("[4/5] Match + diff");
  const { inStateNotInDb, inDbNotInState, mismatches, matched } = match(
    stateRecords,
    listings
  );
  console.log(`  matched:            ${matched.length}`);
  console.log(`  IN_STATE_NOT_IN_DB: ${inStateNotInDb.length}`);
  console.log(`  IN_DB_NOT_IN_STATE: ${inDbNotInState.length}`);
  console.log(`  MISMATCH:           ${mismatches.length}`);

  // Verify Cookies Peoria Heights shows up where expected.
  const cookies = inStateNotInDb.find(
    (r) =>
      /cookies/i.test(r.dispensaryName) && /peoria heights/i.test(r.city)
  );
  console.log("");
  if (cookies) {
    console.log(`  ✓ Cookies Peoria Heights captured in IN_STATE_NOT_IN_DB`);
    console.log(`    slug: ${slugFromStateRecord(cookies)}`);
    console.log(`    address: ${cookies.address1}, ${cookies.city}, IL ${cookies.postalCode}`);
    console.log(`    license: ${cookies.licenseNumber}`);
  } else {
    console.log(`  ✗ Cookies Peoria Heights NOT in IN_STATE_NOT_IN_DB`);
    console.log(`    This is unexpected — matcher may have false-positived. Investigate.`);
  }

  console.log("");
  console.log("[5/5] Write report + migration");
  const date = todayIsoDate();
  // Surface cities not currently covered in our DB so the human-readable
  // report can flag the downstream backfill step. Use clean records only
  // — suspect rows have garbled city fragments ("0 Springfield", "12 e",
  // etc.) that would pollute the list.
  const dbCities = new Set(
    listings.map((l) => normalizeCity(l.city || ""))
  );
  const newCities = Array.from(
    new Set(
      inStateNotInDb
        .filter((r) => r.quality === "clean")
        .map((r) => r.city.trim())
        .filter((c) => c && !dbCities.has(normalizeCity(c)))
    )
  ).sort();

  const report = renderMarkdownReport({
    stateTotal: stateRecords.length,
    matchedCount: matched.length,
    newCount: inStateNotInDb.length,
    orphanCount: inDbNotInState.length,
    mismatchCount: mismatches.length,
    pdfUrl: IDFPR_PDF_URL,
    pdfUpdated,
    inStateNotInDb,
    inDbNotInState,
    mismatches,
    newCities,
  });

  const reportPath = `docs/data-audit-${date}-il-license-registry.md`;
  const migrationPath = `sql/migrations/${date}-il-license-registry-sync.sql`;

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report);
  console.log(`  report  → ${reportPath}`);

  mkdirSync(dirname(migrationPath), { recursive: true });
  const migrationRecords = inStateNotInDb.filter((r) => r.quality === "clean");
  writeFileSync(migrationPath, renderMigration(migrationRecords, date));
  console.log(
    `  migration → ${migrationPath} (${migrationRecords.length} proposed inserts; ${
      inStateNotInDb.length - migrationRecords.length
    } suspect rows excluded — see report)`
  );

  console.log("");
  console.log("Done. Nothing was written to Supabase. Review report + migration before applying.");
  console.log("");
})().catch((err) => {
  console.error("");
  console.error("AUDIT FAILED:", err instanceof Error ? err.message : err);
  console.error("");
  exit(1);
});
