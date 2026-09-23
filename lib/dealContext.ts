// lib/dealContext.ts
// When a deal's big number already says "30% OFF", repeating "30% off flower"
// as the headline reads like a template. Strip the percent phrase and keep
// what's left ("Flower", "First-time") as a short context tag.
// Returns null when nothing meaningful remains — caller falls back to the
// full title.

const PCT_OFF = /\b\d{1,3}\s*%\s*off\b/i;

export function dealContextTag(title: string | null | undefined): string | null {
  if (!title || !PCT_OFF.test(title)) return null;
  // Conditional deals ("BOGO 50% off", "buy 2 get 25% off", "$50+ ...") need
  // the whole sentence — never trim those.
  if (/\b(bogo|buy|get|with|when|over|min(imum)?|spend|\$)\b|\$/i.test(title)) return null;
  const rest = title
    .replace(PCT_OFF, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—:·,]+|[\s\-–—:·,]+$/g, "")
    .trim();
  if (!rest || rest.length < 3) return null;
  if (/^first[- ]time$/i.test(rest)) return "First-time customers";
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}
