// Shared body for the city answer pages (/cheapest/[city]/[item],
// /best-deals/[city], /open-late/[city], /medical/[city], /drive-thru/[city]).
// Built from the Breathe guide parts — GuideShell, QuickAnswer, FaqBlock —
// so every answer page looks like the rest of /guides: the quotable answer
// first, then the list it came from, then a short FAQ with FAQPage schema.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "./GuideShell";
import { QuickAnswer, FaqBlock, GUIDE_EXTRA_CSS } from "../guides/GuideParts";
import { brand } from "../../lib/brand";
import { ANSWER_TOPICS, type Answer, type Seg } from "../../lib/answers";

const CSS = `
.qa-row-src{font-size:.76rem;color:var(--pp-muted)}
.qa-row-src a{color:var(--pp-muted)}
.qa-right{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;gap:2px;text-align:right}
.qa-right b{font-family:var(--font-mono);font-weight:500;font-size:1.05rem;letter-spacing:-.02em;white-space:nowrap}
.qa-right span{font-size:.74rem;color:var(--pp-muted);white-space:nowrap}
.qa-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.qa-links a{font-size:.85rem;padding:6px 11px;border-radius:999px;border:1px solid var(--pp-border);background:var(--pp-surface);color:inherit;text-decoration:none}
.qa-links a[aria-current=page]{border-color:var(--pp-canopy);font-weight:600}
.qa-empty{padding:14px;border-radius:14px;border:1px dashed var(--pp-border);color:var(--pp-muted);font-size:.92rem}
`;

export function Segs({ segs }: { segs: Seg[] }) {
  return (
    <>
      {segs.map((s, i) =>
        typeof s === "string" ? <span key={i}>{s}</span> : <Link key={i} href={s.href}>{s.text}</Link>
      )}
    </>
  );
}

/** Page metadata for an answer: canonical, and noindex when it's thin. */
export function answerMetadata(a: Answer | null): Metadata {
  if (!a) return { robots: { index: false, follow: false } };
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: a.url },
    openGraph: { title: a.metaTitle, description: a.metaDescription, url: a.url, type: "article" },
    ...(a.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

export default function AnswerView({ a }: { a: Answer }) {
  const jsonLd: object[] = [
    ...(a.indexable
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: a.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Central Illinois", item: brand.url },
        ...a.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.label, item: `${brand.url}${c.href}` })),
        { "@type": "ListItem", position: a.crumbs.length + 2, name: a.h1, item: a.url },
      ],
    },
  ];

  return (
    <GuideShell crumbs={a.crumbs} eyebrow={a.eyebrow} title={a.h1} lede={a.lede} jsonLd={jsonLd}>
      <style>{GUIDE_EXTRA_CSS + CSS}</style>
      <QuickAnswer updated={a.updated}>
        <Segs segs={a.answer} />
      </QuickAnswer>

      <h2 className="gp-h2">{a.listHeading}</h2>
      {a.rows.length === 0 ? (
        <p className="qa-empty">{a.emptyList}</p>
      ) : (
        <div className="gp-list">
          {a.rows.map((r) => (
            <div key={r.key} className="gp-row">
              <span className="gp-row-main">
                <Link href={r.href} className="gp-row-title" style={{ color: "inherit" }}>{r.title}</Link>
                <span className="gp-row-sub" style={{ overflowWrap: "anywhere" }}>{r.sub}</span>
                {r.source && (
                  <span className="qa-row-src">
                    <a href={r.source.href} rel="nofollow noopener" target="_blank">{r.source.label}</a>
                  </span>
                )}
              </span>
              {(r.right || r.pill) && (
                <span className="qa-right">
                  {r.right && <b>{r.right}</b>}
                  {r.rightSub && <span>{r.rightSub}</span>}
                  {r.pill && <span className="gp-pill">{r.pill}</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {a.notes.map((n, i) => (
        <p key={i} className="gp-note"><Segs segs={n} /></p>
      ))}

      <FaqBlock faqs={a.faqs} />

      <h2 className="gp-h2">More quick answers for {a.city.name}</h2>
      <nav className="qa-links" aria-label={`Quick answers for ${a.city.name}`}>
        {ANSWER_TOPICS.map((t) => (
          <Link key={t.topic} href={t.path(a.city.slug)} aria-current={t.topic === a.topic ? "page" : undefined}>{t.short}</Link>
        ))}
      </nav>
      <p className="gp-note">Prices, hours and deals change during the day; confirm at the counter. Something wrong? Email {brand.supportEmail}. 21+.</p>
    </GuideShell>
  );
}
