// lib/submissionValidation.ts
// Shared validators for the /deals/submit form + API route.
// Pairs with sql/migrations/2026-04-21-deal-submissions.sql (NOT YET APPLIED).
// The constraint `at_least_one_denominator` in the DB enforces the same
// "need weight OR mg OR count" rule; we check client-side first for a
// friendlier error, then re-check server-side before hitting the DB.

export type Category =
  | "flower"
  | "pre-roll"
  | "vape"
  | "concentrate"
  | "edibles"
  | "topicals"
  | "accessories"
  | "all";

export type SubmitterRole =
  | "owner"
  | "manager"
  | "budtender"
  | "marketing"
  | "other";

export type SubmissionInput = {
  dispensary_slug?: string | null;
  dispensary_name_freetext?: string | null;
  dispensary_city_freetext?: string | null;
  submitter_email: string;
  submitter_role: SubmitterRole;

  deal_title: string;
  deal_description?: string | null;
  category: Category;

  strain_or_product?: string | null;
  brand?: string | null;

  weight_grams?: number | null;
  mg_thc?: number | null;
  count?: number | null;

  regular_price_usd?: number | null;
  sale_price_usd?: number | null;

  start_date?: string | null;
  end_date?: string | null;
  is_recurring?: boolean;
  recurring_days?: string[] | null;

  source_url?: string | null;
  notes?: string | null;

  // Honeypot — any value here means likely bot.
  website?: string | null;
};

export type ValidationError = {
  field: keyof SubmissionInput | "_form";
  message: string;
};

const EMAIL_RX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URL_RX = /^https?:\/\/\S+$/i;

const CATEGORIES_NEEDING_WEIGHT: Category[] = ["flower", "pre-roll", "concentrate", "vape"];
const CATEGORIES_NEEDING_MG: Category[] = ["edibles", "topicals"];
const CATEGORIES_NO_PRICE_REQUIRED: Category[] = ["accessories", "all"];

const SPAM_TOKENS = [
  "viagra",
  "cialis",
  "casino",
  "bet365",
  "bitcoin",
  "crypto-miner",
  "nude",
  "porn",
  "escort",
];

export function validateSubmission(input: SubmissionInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Honeypot — caller should treat this as "silently drop" but we surface
  // it so the API route can decide.
  if (input.website && input.website.trim().length > 0) {
    errors.push({ field: "website", message: "Spam trap triggered." });
  }

  // Submitter
  if (!input.submitter_email || !EMAIL_RX.test(input.submitter_email.trim())) {
    errors.push({ field: "submitter_email", message: "Enter a valid email address." });
  }
  if (!input.submitter_role) {
    errors.push({ field: "submitter_role", message: "Select your role." });
  }

  // Dispensary — must have slug OR freetext pair.
  const hasSlug = !!(input.dispensary_slug && input.dispensary_slug.trim());
  const hasFreetext =
    !!(input.dispensary_name_freetext && input.dispensary_name_freetext.trim()) &&
    !!(input.dispensary_city_freetext && input.dispensary_city_freetext.trim());
  if (!hasSlug && !hasFreetext) {
    errors.push({
      field: "dispensary_slug",
      message: "Pick your dispensary from the list, or enter its name and city.",
    });
  }

  // Deal content
  if (!input.deal_title || input.deal_title.trim().length === 0) {
    errors.push({ field: "deal_title", message: "Deal title is required." });
  } else if (input.deal_title.length > 120) {
    errors.push({ field: "deal_title", message: "Deal title must be 120 characters or fewer." });
  } else {
    const lower = input.deal_title.toLowerCase();
    if (SPAM_TOKENS.some((tok) => lower.includes(tok))) {
      errors.push({ field: "deal_title", message: "Deal title flagged as spam." });
    }
  }
  if (input.deal_description && input.deal_description.length > 500) {
    errors.push({ field: "deal_description", message: "Description must be 500 characters or fewer." });
  }
  if (!input.category) {
    errors.push({ field: "category", message: "Pick a category." });
  }

  // Denominator — at least one of weight/mg/count unless category is accessories/all
  const needsWeight = CATEGORIES_NEEDING_WEIGHT.includes(input.category);
  const needsMg = CATEGORIES_NEEDING_MG.includes(input.category);
  const skipPrice = CATEGORIES_NO_PRICE_REQUIRED.includes(input.category);

  if (needsWeight && (input.weight_grams == null || !(Number(input.weight_grams) > 0))) {
    errors.push({
      field: "weight_grams",
      message: "Weight in grams is required for this category.",
    });
  }
  if (needsMg && (input.mg_thc == null || !(Number(input.mg_thc) > 0))) {
    errors.push({
      field: "mg_thc",
      message: "Total THC in mg is required for this category.",
    });
  }

  // Pricing
  if (!skipPrice) {
    if (input.sale_price_usd == null || !(Number(input.sale_price_usd) > 0)) {
      errors.push({ field: "sale_price_usd", message: "Sale price is required." });
    }
    if (
      input.regular_price_usd != null &&
      input.sale_price_usd != null &&
      Number(input.sale_price_usd) > Number(input.regular_price_usd)
    ) {
      errors.push({
        field: "sale_price_usd",
        message: "Sale price cannot be higher than the regular price.",
      });
    }
  }

  // Dates
  if (input.start_date && input.end_date) {
    const s = new Date(input.start_date).getTime();
    const e = new Date(input.end_date).getTime();
    if (Number.isFinite(s) && Number.isFinite(e) && e < s) {
      errors.push({ field: "end_date", message: "End date must be after the start date." });
    }
  }

  if (input.recurring_days && input.recurring_days.length > 0 && !input.is_recurring) {
    errors.push({
      field: "recurring_days",
      message: "Pick the 'recurring' checkbox to set recurring days.",
    });
  }

  // Source URL
  if (input.source_url && !URL_RX.test(input.source_url.trim())) {
    errors.push({ field: "source_url", message: "Source URL must start with http:// or https://." });
  }

  return errors;
}

// DB insert payload — strip honeypot + derive fields.
export function toInsertPayload(input: SubmissionInput) {
  return {
    dispensary_slug: input.dispensary_slug?.trim() || null,
    dispensary_name_freetext: input.dispensary_name_freetext?.trim() || null,
    dispensary_city_freetext: input.dispensary_city_freetext?.trim() || null,
    submitter_email: input.submitter_email.trim().toLowerCase(),
    submitter_role: input.submitter_role,
    deal_title: input.deal_title.trim(),
    deal_description: input.deal_description?.trim() || null,
    category: input.category,
    strain_or_product: input.strain_or_product?.trim() || null,
    brand: input.brand?.trim() || null,
    weight_grams: toNumOrNull(input.weight_grams),
    mg_thc: toNumOrNull(input.mg_thc),
    count: toIntOrNull(input.count),
    regular_price_usd: toNumOrNull(input.regular_price_usd),
    sale_price_usd: toNumOrNull(input.sale_price_usd),
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    is_recurring: !!input.is_recurring,
    recurring_days:
      input.is_recurring && input.recurring_days && input.recurring_days.length > 0
        ? input.recurring_days
        : null,
    source_url: input.source_url?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

function toNumOrNull(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(v: number | string | null | undefined): number | null {
  const n = toNumOrNull(v);
  if (n == null) return null;
  return Math.round(n);
}

export function pricePerGram(weight: number | null | undefined, sale: number | null | undefined) {
  const w = Number(weight);
  const s = Number(sale);
  if (!Number.isFinite(w) || !Number.isFinite(s) || w <= 0 || s <= 0) return null;
  return Math.round((s / w) * 100) / 100;
}

export function pricePerMg(mg: number | null | undefined, sale: number | null | undefined) {
  const m = Number(mg);
  const s = Number(sale);
  if (!Number.isFinite(m) || !Number.isFinite(s) || m <= 0 || s <= 0) return null;
  return Math.round((s / m) * 10000) / 10000;
}

// ---------- server-side coercion ----------
// The API route receives arbitrary JSON. Coerce it into a SubmissionInput
// with every string trimmed and length-capped, enums checked, numbers
// bounded and arrays filtered, so validateSubmission / toInsertPayload never
// see a non-string where they call .trim(), and nothing oversized reaches
// the database. Unknown enum values become "" so validation rejects them.
const CATEGORY_SET = new Set<Category>(["flower", "pre-roll", "vape", "concentrate", "edibles", "topicals", "accessories", "all"]);
const ROLE_SET = new Set<SubmitterRole>(["owner", "manager", "budtender", "marketing", "other"]);
const DAY_SET = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

function s(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}
function n(v: unknown, max: number): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(x) && x >= 0 && x <= max ? x : null;
}
function d(v: unknown): string | null {
  const t = s(v, 40);
  return t && /^\d{4}-\d{2}-\d{2}/.test(t) && Number.isFinite(Date.parse(t)) ? t : null;
}

export function coerceSubmission(raw: Record<string, unknown>): SubmissionInput {
  const category = typeof raw.category === "string" && CATEGORY_SET.has(raw.category as Category) ? (raw.category as Category) : ("" as Category);
  const role = typeof raw.submitter_role === "string" && ROLE_SET.has(raw.submitter_role as SubmitterRole) ? (raw.submitter_role as SubmitterRole) : ("" as SubmitterRole);
  const slug = s(raw.dispensary_slug, 120);
  // Over-length titles/descriptions are kept long enough to trip the
  // validator's own "must be N characters or fewer" message.
  return {
    dispensary_slug: slug && /^[a-z0-9-]+$/.test(slug) ? slug : null,
    dispensary_name_freetext: s(raw.dispensary_name_freetext, 120),
    dispensary_city_freetext: s(raw.dispensary_city_freetext, 60),
    submitter_email: s(raw.submitter_email, 254) || "",
    submitter_role: role,
    deal_title: s(raw.deal_title, 121) || "",
    deal_description: s(raw.deal_description, 501),
    category,
    strain_or_product: s(raw.strain_or_product, 120),
    brand: s(raw.brand, 80),
    weight_grams: n(raw.weight_grams, 1000),
    mg_thc: n(raw.mg_thc, 100000),
    count: n(raw.count, 1000),
    regular_price_usd: n(raw.regular_price_usd, 10000),
    sale_price_usd: n(raw.sale_price_usd, 10000),
    start_date: d(raw.start_date),
    end_date: d(raw.end_date),
    is_recurring: raw.is_recurring === true,
    recurring_days: Array.isArray(raw.recurring_days)
      ? raw.recurring_days.filter((x): x is string => typeof x === "string" && DAY_SET.has(x.toLowerCase())).slice(0, 7)
      : null,
    source_url: s(raw.source_url, 500),
    notes: s(raw.notes, 1000),
    website: typeof raw.website === "string" ? raw.website.slice(0, 200) : null,
  };
}
