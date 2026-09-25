// Shared pieces for the /guides answer pages: the quotable quick answer,
// the FAQ block (+ FAQPage / BreadcrumbList JSON-LD), sources, related links.
// Everything sits inside GuideShell and reuses the gp-* classes.
import Link from "next/link";
import { brand } from "../../lib/brand";
import { GUIDES } from "../../lib/guides";

export const GUIDE_EXTRA_CSS = `
.gq{margin:20px 0 6px;padding:16px 18px;border-radius:16px;background:var(--pp-haze);border:1px solid var(--pp-haze-border)}
.gq-l{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-muted);margin:0 0 6px}
.gq p{margin:0;font-size:1.04rem;line-height:1.55;color:var(--pp-ink);max-width:66ch}
.gq-u{display:block;margin-top:8px;font-family:var(--font-mono);font-size:.72rem;color:var(--pp-muted)}
.gp-ul{margin:0 0 12px;padding-left:1.2rem;line-height:1.6;max-width:66ch}
.gp-ul li{margin-bottom:6px}
.gp-faq{border-top:1px solid var(--pp-border)}
.gp-faq div{padding:14px 0;border-bottom:1px solid var(--pp-border)}
.gp-faq h3{font-size:1rem;font-weight:600;margin:0 0 6px;font-family:var(--font-body)}
.gp-faq p{margin:0;line-height:1.55;color:var(--pp-body);max-width:66ch}
.gp-srcs{margin:8px 0 0;padding-left:1.1rem;font-size:.84rem;color:var(--pp-muted);line-height:1.6}
.gp-srcs a{color:var(--pp-muted)}
.gp-table-wrap{overflow-x:auto;border:1px solid var(--pp-border);border-radius:14px;background:var(--pp-surface);padding:0 8px}
`;

export function QuickAnswer({ children, updated }: { children: React.ReactNode; updated: string }) {
  return (
    <section className="gq" aria-label="Quick answer">
      <p className="gq-l">Quick answer</p>
      <p>{children}</p>
      <span className="gq-u">Updated {updated}</span>
    </section>
  );
}

export type Faq = { q: string; a: string };

export function FaqBlock({ faqs }: { faqs: Faq[] }) {
  return (
    <>
      <h2 className="gp-h2">Common questions</h2>
      <div className="gp-faq">
        {faqs.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export type Source = { href: string; label: string };

export function Sources({ items, checked }: { items: Source[]; checked: string }) {
  return (
    <>
      <h2 className="gp-h2">Sources</h2>
      <p className="gp-note">Checked {checked}. Laws and store policies change; if something here looks out of date, tell us at {brand.supportEmail}.</p>
      <ul className="gp-srcs">
        {items.map((s) => (
          <li key={s.href}>
            <a href={s.href} rel="nofollow noopener" target="_blank">{s.label}</a>
          </li>
        ))}
      </ul>
    </>
  );
}

export function RelatedGuides({ current, extra }: { current: string; extra?: { href: string; label: string }[] }) {
  const others = GUIDES.filter((g) => g.slug !== current).slice(0, 7);
  return (
    <>
      <h2 className="gp-h2">Related</h2>
      <div className="gp-list">
        {(extra || []).map((e) => (
          <Link key={e.href} href={e.href} className="gp-row">
            <span className="gp-row-main"><span className="gp-row-title">{e.label}</span></span>
          </Link>
        ))}
        {others.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="gp-row">
            <span className="gp-row-main"><span className="gp-row-title">{g.question}</span></span>
          </Link>
        ))}
        <Link href="/guides" className="gp-row">
          <span className="gp-row-main"><span className="gp-row-title">All guides</span></span>
        </Link>
      </div>
    </>
  );
}

/** FAQPage + BreadcrumbList (+ optional Article) for a guide. */
export function guideJsonLd(opts: { slug: string; title: string; faqs: Faq[]; dateModified: string }) {
  const url = `${brand.url}/guides/${opts.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: opts.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Central Illinois", item: brand.url },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${brand.url}/guides` },
        { "@type": "ListItem", position: 3, name: opts.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opts.title,
      dateModified: opts.dateModified,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: brand.name, url: brand.url },
      publisher: { "@type": "Organization", name: brand.name, url: brand.url },
    },
  ];
}

export const GUIDE_CRUMBS = [{ href: "/guides", label: "Guides" }];
