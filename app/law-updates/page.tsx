// app/law-updates/page.tsx — every Illinois / Central Illinois cannabis law
// change PuffPrice tracks, newest first, with the source each time, plus
// "email me when the law changes" (law_watch, lib/dealWatch.ts). One source
// of truth: LAW_FACTS (lib/social/laws.ts). Feed: /law-updates/feed.xml.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import WatchControl from "../components/WatchControl";
import { brand } from "../../lib/brand";
import { LAW_FACTS } from "../../lib/social/laws";
import { ctDay, shortDay } from "../../lib/social/time";
import { lawTimeline, momentLine } from "../../lib/lawUpdates";
import { CENTRAL_IL_CITIES } from "../../lib/constants/regions";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Illinois Cannabis Law Changes: What's New, in Plain Words",
  description:
    "Every Illinois and Central Illinois cannabis law change PuffPrice tracks — drive-thrus, the Nov 12 hemp cap, possession limits, delivery — newest first, with sources. Get an email when the law changes.",
  alternates: { canonical: `${brand.url}/law-updates`, types: { "application/rss+xml": `${brand.url}/law-updates/feed.xml` } },
};

export default function LawUpdatesPage() {
  const today = ctDay();
  const timeline = lawTimeline(LAW_FACTS, today);
  const upcoming = LAW_FACTS.filter((f) => f.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Illinois cannabis law changes tracked by PuffPrice",
    url: `${brand.url}/law-updates`,
    itemListElement: timeline.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "Article", headline: momentLine(m), datePublished: m.day, url: `${brand.url}${m.fact.page}`, citation: m.fact.sourceUrl, publisher: { "@type": "Organization", name: brand.name } },
    })),
  };

  return (
    <GuideShell
      crumbs={[{ href: "/guides", label: "Guides" }]}
      eyebrow="Law watch · Illinois + Central Illinois"
      title="Illinois cannabis law changes"
      lede={<>What changed, what&apos;s coming, and what it means if you buy in Peoria, Bloomington-Normal, Champaign-Urbana, Pekin or Springfield. Plain words, the source every time. Not legal advice.</>}
      jsonLd={jsonLd}
    >
      <div className="gp-cta">
        <b>Get an email when the law changes</b>
        <WatchControl kind="law" cities={CENTRAL_IL_CITIES.map((c) => c.name)} startOpen />
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className="gp-h2">Coming up</h2>
          <div className="gp-timeline">
            {upcoming.map((f) => (
              <div key={f.id}>
                <div className="when">{shortDay(f.date)}</div>
                <b>{f.headline}</b> {f.body}{" "}
                <Link href={f.page}>What it means here</Link>{" "}
                <span className="gp-src">— <a href={f.sourceUrl} rel="nofollow noopener" target="_blank">{f.sourceName}</a></span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="gp-h2">Every change, newest first</h2>
      <div className="gp-timeline">
        {timeline.map((m) => (
          <div key={`${m.fact.id}-${m.kind}`}>
            <div className="when">{m.kind === "effective" ? `Took effect ${shortDay(m.day)}` : `Posted ${shortDay(m.day)}`}</div>
            <b>{m.fact.headline}</b> {m.fact.body}{" "}
            <Link href={m.fact.page}>What it means here</Link>{" "}
            <span className="gp-src">— <a href={m.fact.sourceUrl} rel="nofollow noopener" target="_blank">{m.fact.sourceName}</a></span>
          </div>
        ))}
      </div>

      <p className="gp-note">
        Follow along in any feed reader: <a href="/law-updates/feed.xml">/law-updates/feed.xml</a>. See something we missed or got wrong? Write to{" "}
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>. For adults 21 and over.
      </p>
    </GuideShell>
  );
}
