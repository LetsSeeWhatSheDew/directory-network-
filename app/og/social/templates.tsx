// app/og/social/templates.tsx — the six daily social templates, in Breathe.
// Day: cream paper with morning haze. Night: deep green with firefly glow.
// The savings figure (or the one key figure) is the only bold element.
// No product photos, no smoke, no people. Every image carries its
// "As of … CT" line, "21+" and "puffprice.com".
//
// Satori notes (docs/brand/2026-09-24-breathe-everywhere.md): any div with
// more than one child needs display:flex; radial-gradient(circle, …) only.

import { C, Wordmark, Backdrop, Orb } from "../shared";
import { SOCIAL_SIZES, TEMPLATE_LABEL, type CheapestData, type CityData, type DriveThruData, type IndexData, type LawData, type SavingData, type SocialSize, type SocialTemplate } from "../../../lib/social/types";
import { lawDateLabel } from "../../../lib/social/laws";
import { monthDay, weekdayShort } from "../../../lib/social/time";

type P = { size: SocialSize; night: boolean };

function tone(night: boolean) {
  return {
    ink: night ? C.nInk : C.ink,
    body: night ? C.nBody : C.body,
    muted: night ? C.nMuted : C.muted,
    accent: night ? C.mint : C.canopy,
    big: night ? C.firefly : C.ink,
    glow: night ? "0 0 28px rgba(238,243,176,0.25)" : "none",
    surface: night ? C.nSurface : C.surface,
    border: night ? "rgba(168,230,191,0.14)" : C.border,
    bar: night ? "rgba(168,230,191,0.45)" : C.sage,
    barNow: night ? C.firefly : C.canopy,
  };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const money = (n: number) => `$${n.toFixed(2)}`;

function Frame({ size, night, template, asOf, sample, children }: P & { template: SocialTemplate; asOf: string; sample?: boolean; children: React.ReactNode }) {
  const [W, H] = SOCIAL_SIZES[size];
  const story = size === "story";
  const t = tone(night);
  return (
    <Backdrop w={W} h={H} night={night}>
      <div style={{ display: "flex", flexDirection: "column", width: W, height: H, padding: story ? "200px 76px 230px" : "62px 72px 54px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark size={44} night={night} />
          <span style={{ fontFamily: "Mono", fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase", color: t.muted }}>{TEMPLATE_LABEL[template]}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: t.muted, borderTop: `1px solid ${t.border}`, paddingTop: 18 }}>
          <span style={{ fontFamily: "Mono" }}>{asOf ? `As of ${asOf}` : "puffprice.com"}</span>
          <span style={{ fontFamily: "Mono" }}>21+ · puffprice.com</span>
        </div>
      </div>
      {sample && (
        <div style={{ position: "absolute", right: 24, top: story ? 130 : 14, display: "flex", fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 999, background: night ? "rgba(240,138,100,0.18)" : "#F8E4DC", color: night ? "#F5B097" : "#8A2E1B", border: `1px solid ${night ? "#F08A64" : "#C24A1E"}` }}>
          Sample data · not live
        </div>
      )}
    </Backdrop>
  );
}

function Serif({ a, b, size, night, center = false }: { a: string; b?: string; size: number; night: boolean; center?: boolean }) {
  const t = tone(night);
  return (
    <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: size, lineHeight: 1.04, color: t.ink, alignItems: center ? "center" : "flex-start", textAlign: center ? "center" : "left" }}>
      <span>{a}</span>
      {b && <span style={{ fontStyle: "italic", color: t.accent }}>{b}</span>}
    </div>
  );
}

// ── 1. Today's biggest saving ───────────────────────────────────────────────

export function SavingCard({ d, size, night }: P & { d: SavingData }) {
  const t = tone(night);
  const story = size === "story";
  const orb = story ? 860 : 690;
  let inner: React.ReactNode;
  if (d.status === "ok") {
    const x = d.deal;
    inner = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{ fontSize: 22, letterSpacing: "0.26em", textTransform: "uppercase", color: t.body, fontWeight: 500 }}>Central Illinois, today</span>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 8, color: t.big, textShadow: t.glow }}>
          <span style={{ fontWeight: 700, fontSize: x.saving.length > 3 ? 196 : 224, letterSpacing: "-0.055em", lineHeight: 1 }}>{x.saving}</span>
          <span style={{ fontWeight: 600, fontSize: 48, marginLeft: 12 }}>off</span>
        </div>
        <span style={{ fontSize: 30, color: t.body, marginTop: 16, lineHeight: 1.3 }}>{clip(x.product, 46)}</span>
        <span style={{ fontSize: 30, color: t.ink, fontWeight: 600, marginTop: 4 }}>{clip(`${x.store}, ${x.city}`, 40)}</span>
      </div>
    );
  } else if (d.status === "none") {
    inner = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{ fontFamily: "Mono", fontSize: 170, color: t.accent, lineHeight: 1 }}>{String(d.live)}</span>
        <span style={{ fontSize: 30, color: t.body, marginTop: 8 }}>deals checked this morning</span>
        <span style={{ fontSize: 26, color: t.muted, marginTop: 12 }}>No single everyday discount stood out.</span>
      </div>
    );
  } else {
    inner = <span style={{ fontFamily: "Serif", fontSize: 72, color: t.accent }}>Checked every morning</span>;
  }
  const count = d.status === "unknown" ? "" : `One of ${d.live} deals at ${d.stores} stores, each checked on the store's own site.`;
  return (
    <Frame size={size} night={night} template="saving" asOf={d.asOf} sample={d.sample}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Orb size={orb} night={night}>{inner}</Orb>
        <div style={{ display: "flex", marginTop: story ? 56 : 18 }}>
          <Serif a="Drop your shoulders." b="The comparing is done." size={story ? 66 : 54} night={night} center />
        </div>
        {d.status === "ok" && <span style={{ fontSize: story ? 28 : 25, color: t.body, marginTop: story ? 40 : 22, textAlign: "center" }}>{count}</span>}
      </div>
    </Frame>
  );
}

// ── 2. City roundup ─────────────────────────────────────────────────────────

export function CityCard({ d, size, night }: P & { d: CityData }) {
  const t = tone(night);
  const story = size === "story";
  const n = d.deals.length;
  return (
    <Frame size={size} night={night} template="city" asOf={d.asOf} sample={d.sample}>
      <Serif a={`${d.city}, today.`} b={n > 1 ? `The ${n} biggest savings.` : n === 1 ? "The biggest saving." : d.status === "unknown" ? "Back in a few minutes." : "A quiet day."} size={story ? 96 : 84} night={night} />
      <div style={{ display: "flex", flexDirection: "column", gap: story ? 26 : 20, marginTop: story ? 64 : 44 }}>
        {d.deals.map((x, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 30, padding: story ? "34px 36px" : "26px 32px" }}>
            <div style={{ display: "flex", alignItems: "baseline", width: 300, color: t.big, textShadow: t.glow }}>
              <span style={{ fontWeight: 700, fontSize: i === 0 ? 118 : 92, letterSpacing: "-0.05em", lineHeight: 1 }}>{x.saving}</span>
              <span style={{ fontWeight: 600, fontSize: i === 0 ? 34 : 28, marginLeft: 8 }}>off</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: 30, color: t.body, lineHeight: 1.25 }}>{clip(x.product, 40)}</span>
              <span style={{ fontSize: 30, color: t.ink, fontWeight: 600, marginTop: 6 }}>{clip(x.store, 30)}</span>
            </div>
          </div>
        ))}
        {n === 0 && (
          <span style={{ fontSize: 32, color: t.body, lineHeight: 1.4 }}>
            {d.status === "unknown" ? "We couldn't read today's deals just now." : `No everyday discounts posted in ${d.city} this morning.`}
          </span>
        )}
      </div>
      {d.status === "ok" && (
        <span style={{ fontSize: 25, color: t.body, marginTop: story ? 40 : 28 }}>{`${d.live} deals live in ${d.city} in all. One per store, from each store's own site.`}</span>
      )}
    </Frame>
  );
}

// ── 3. Deal Index weekly ────────────────────────────────────────────────────

function WeekBars({ week, night, height }: { week: { day: string; deals: number }[]; night: boolean; height: number }) {
  const t = tone(night);
  const max = Math.max(1, ...week.map((w) => w.deals));
  const last = week.length - 1;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height, borderBottom: `2px solid ${t.border}` }}>
        {week.map((w, i) => {
          const h = Math.max(6, Math.round((w.deals / max) * (height - 40)));
          const labelled = i === 0 || i === last;
          return (
            <div key={w.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flex: 1, height }}>
              {labelled && <span style={{ fontFamily: "Mono", fontSize: 22, color: i === last ? t.ink : t.muted, marginBottom: 6 }}>{String(w.deals)}</span>}
              <div style={{ display: "flex", width: "100%", height: h, background: i === last ? t.barNow : t.bar, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        {week.map((w) => (
          <div key={w.day} style={{ display: "flex", flex: 1, justifyContent: "center", fontFamily: "Mono", fontSize: 18, color: t.muted }}>{weekdayShort(w.day)}</div>
        ))}
      </div>
    </div>
  );
}

export function IndexCard({ d, size, night }: P & { d: IndexData }) {
  const t = tone(night);
  const story = size === "story";
  if (d.status !== "ok") {
    return (
      <Frame size={size} night={night} template="index" asOf={d.asOf} sample={d.sample}>
        <Serif a="The Deal Index is" b="still being tallied." size={84} night={night} />
      </Frame>
    );
  }
  const heroPct = d.avgPct != null;
  const rows = d.cities.slice(0, story ? 9 : 6);
  const cell = (s: string, w: number, color: string = t.ink) => (
    <div style={{ display: "flex", width: w, justifyContent: "flex-end", fontFamily: "Mono", fontSize: 24, color }}>{s}</div>
  );
  return (
    <Frame size={size} night={night} template="index" asOf={d.asOf} sample={d.sample}>
      <Serif a="Central Illinois," b={`the week to ${monthDay(d.day)}.`} size={story ? 84 : 70} night={night} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 40, marginTop: story ? 44 : 26 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 700, fontSize: story ? 200 : 170, letterSpacing: "-0.055em", lineHeight: 0.9, color: t.big, textShadow: t.glow }}>{heroPct ? `${d.avgPct}%` : String(d.deals)}</span>
          <span style={{ fontSize: 26, color: t.body, marginTop: 10 }}>{heroPct ? `average discount, ${monthDay(d.day)}` : `deals live, ${monthDay(d.day)}`}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40 }}>
          {heroPct && <span style={{ fontFamily: "Mono", fontSize: 30, color: t.ink }}>{`${d.deals} deals live`}</span>}
          <span style={{ fontFamily: "Mono", fontSize: 30, color: t.ink }}>{`${d.stores} stores discounting`}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: story ? 50 : 28 }}>
        <span style={{ fontSize: 22, color: t.muted, marginBottom: 10 }}>Deals live, day by day</span>
        <WeekBars week={d.week} night={night} height={story ? 220 : 150} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: story ? 50 : 26, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 24, padding: "14px 26px" }}>
        <div style={{ display: "flex", padding: "6px 0", borderBottom: `1px solid ${t.border}` }}>
          <span style={{ flex: 1, fontSize: 20, color: t.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>City</span>
          {cell("Deals", 130, t.muted)}
          {cell("Stores", 140, t.muted)}
          {cell("Avg off", 170, t.muted)}
        </div>
        {rows.map((c) => (
          <div key={c.city} style={{ display: "flex", padding: "7px 0" }}>
            <span style={{ flex: 1, fontSize: 26, color: t.ink, fontWeight: 600 }}>{c.city}</span>
            {cell(String(c.deals), 130)}
            {cell(String(c.stores), 140)}
            {cell(c.avgPct != null ? `${c.avgPct}%` : "—", 170)}
          </div>
        ))}
      </div>
      {d.coverageNote && <span style={{ fontSize: 20, color: t.muted, marginTop: 14, lineHeight: 1.35 }}>{d.coverageNote}</span>}
    </Frame>
  );
}

// ── 4. Cheapest out-the-door eighth by city ────────────────────────────────

export function CheapestCard({ d, size, night }: P & { d: CheapestData }) {
  const t = tone(night);
  const story = size === "story";
  if (d.status !== "ok") {
    return (
      <Frame size={size} night={night} template="cheapest" asOf={d.asOf} sample={d.sample}>
        <Serif a="No fresh menu prices" b="to report right now." size={80} night={night} />
      </Frame>
    );
  }
  const rows = d.rows.slice(0, story ? 9 : 7);
  return (
    <Frame size={size} night={night} template="cheapest" asOf={d.asOf} sample={d.sample}>
      <Serif a="The cheapest eighth," b="city by city." size={story ? 96 : 82} night={night} />
      <span style={{ fontSize: 26, color: t.body, marginTop: 14 }}>3.5g of flower, any brand, from each store&rsquo;s own menu.</span>
      <div style={{ display: "flex", flexDirection: "column", marginTop: story ? 50 : 32, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 28, padding: "8px 30px" }}>
        {rows.map((r, i) => (
          <div key={r.city} style={{ display: "flex", alignItems: "center", padding: story ? "22px 0" : "16px 0", borderTop: i ? `1px solid ${t.border}` : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: 30, color: t.ink, fontWeight: 600 }}>{r.city}</span>
              <span style={{ fontSize: 23, color: t.muted, marginTop: 2 }}>{clip(r.store, 34)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? 64 : 46, letterSpacing: "-0.04em", color: i === 0 ? t.big : t.ink, textShadow: i === 0 ? t.glow : "none", lineHeight: 1 }}>{money(r.otd)}</span>
              <span style={{ fontSize: 19, color: t.muted, marginTop: 4 }}>{`${money(r.pretax)} shelf · est. with tax`}</span>
            </div>
          </div>
        ))}
      </div>
      <span style={{ fontSize: 21, color: t.muted, marginTop: 16, lineHeight: 1.4 }}>
        Out-the-door is our estimate with each city&rsquo;s cannabis taxes. Only cities where we could read a menu are listed.
      </span>
    </Frame>
  );
}

// ── 5. Law you should know ─────────────────────────────────────────────────

export function LawCard({ d, size, night }: P & { d: LawData }) {
  const t = tone(night);
  const story = size === "story";
  const f = d.fact;
  return (
    <Frame size={size} night={night} template="law" asOf={d.asOf} sample={d.sample}>
      <span style={{ fontFamily: "Mono", fontSize: 24, color: t.accent, letterSpacing: "0.08em" }}>{lawDateLabel(f)}</span>
      <div style={{ display: "flex", marginTop: 16 }}>
        <Serif a={f.headline} size={story ? 88 : 76} night={night} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: story ? 56 : 36 }}>
        <span style={{ fontWeight: 700, fontSize: f.figure.length > 5 ? 150 : 190, letterSpacing: "-0.05em", lineHeight: 0.95, color: t.big, textShadow: t.glow }}>{f.figure}</span>
      </div>
      <span style={{ fontSize: 28, color: t.body, marginTop: 8 }}>{f.figureNote}</span>
      <div style={{ display: "flex", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 28, padding: "28px 32px", marginTop: story ? 56 : 36 }}>
        <span style={{ fontSize: story ? 32 : 29, color: t.ink, lineHeight: 1.45 }}>{f.body}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 22, color: t.muted }}>
        <span>{`Source: ${f.sourceName}`}</span>
        <span>Not legal advice</span>
      </div>
    </Frame>
  );
}

// ── 6. Drive-thru tracker ──────────────────────────────────────────────────

export function DriveThruCard({ d, size, night }: P & { d: DriveThruData }) {
  const t = tone(night);
  const story = size === "story";
  if (d.status !== "ok") {
    return (
      <Frame size={size} night={night} template="drive-thru" asOf={d.asOf} sample={d.sample}>
        <Serif a="Drive-thru tracker" b="is updating." size={84} night={night} />
      </Frame>
    );
  }
  const n = d.open.length;
  return (
    <Frame size={size} night={night} template="drive-thru" asOf={d.asOf} sample={d.sample}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Orb size={story ? 800 : 620} night={night}>
          <span style={{ fontSize: 26, letterSpacing: "0.22em", textTransform: "uppercase", color: t.body, fontWeight: 600 }}>Drive-thrus open</span>
          <span style={{ fontSize: 26, letterSpacing: "0.22em", textTransform: "uppercase", color: t.body, fontWeight: 600 }}>in Central Illinois</span>
          <span style={{ fontWeight: 700, fontSize: story ? 330 : 270, lineHeight: 0.9, letterSpacing: "-0.06em", color: t.big, textShadow: t.glow, marginTop: 8 }}>{String(n)}</span>
          <span style={{ fontSize: 28, color: t.body, marginTop: 6 }}>{`of the ${d.tracked} stores we track`}</span>
        </Orb>
        <div style={{ display: "flex", marginTop: story ? 50 : 20 }}>
          <Serif a="Legal since June 12, 2026." b={n === 0 ? "Not one here, yet." : "The first ones are here."} size={story ? 64 : 52} night={night} center />
        </div>
        <span style={{ fontSize: story ? 29 : 26, color: t.body, marginTop: story ? 36 : 18, textAlign: "center", lineHeight: 1.4, maxWidth: 860 }}>
          {n === 0
            ? `A city has to update its cannabis ordinance before a store can apply.${d.announced ? ` ${d.announced === 1 ? "One store has" : `${d.announced} stores have`} announced one.` : ""}`
            : clip(d.open.map((o) => `${o.store}, ${o.city}`).join(" · "), 90)}
        </span>
      </div>
    </Frame>
  );
}

