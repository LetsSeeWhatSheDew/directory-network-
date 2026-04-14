// app/api/digest/preview/route.ts
// GET /api/digest/preview?format=html|text|json
// Live preview of the weekly digest email — used for QA before
// triggering the actual send job.

import { NextRequest, NextResponse } from "next/server";
import { buildWeeklyDigest, renderDigestEmail } from "@/lib/weeklyDigest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") || "html";

  try {
    const payload = await buildWeeklyDigest();

    if (format === "json") {
      return NextResponse.json(payload);
    }

    const rendered = renderDigestEmail(payload);

    if (format === "text") {
      return new NextResponse(rendered.text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Default: HTML — wrap with subject visible at top so previewers see what
    // the recipient's inbox would show.
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Digest preview — ${escapeHtml(rendered.subject)}</title>
  <style>
    body { background: #f5f4f0; margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
    .meta { max-width: 600px; margin: 0 auto 16px; padding: 12px 16px; background: #fff; border: 1px solid #e8e4da; border-radius: 8px; font-size: .85rem; color: #6b7280; }
    .meta strong { color: #0f1f3d; }
  </style>
</head>
<body>
  <div class="meta">
    <strong>Subject:</strong> ${escapeHtml(rendered.subject)}<br>
    <strong>Generated:</strong> ${escapeHtml(payload.generatedAt)}<br>
    <strong>Active deals:</strong> ${payload.totalDeals}
  </div>
  ${rendered.html}
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("[digest/preview] error:", e);
    return NextResponse.json({ error: "Could not build digest." }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
