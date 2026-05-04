"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CITY_TAX_RATES,
  STATE_EXCISE_RATES,
  TAX_RATES_LAST_UPDATED,
  type ThcTier,
  calculateOutTheDoor,
  findCityRates,
  formatPercent,
  formatUsd,
} from "../../lib/taxRates";

const TIER_LABELS: Record<ThcTier, { title: string; sub: string }> = {
  flower: {
    title: "Flower / pre-rolls",
    sub: "≤35% THC · 10% excise",
  },
  concentrate: {
    title: "Concentrate / vape",
    sub: ">35% THC · 25% excise",
  },
  edible: {
    title: "Edible / drink / topical",
    sub: "Cannabis-infused · 20% excise",
  },
};

export default function Calculator({ defaultCitySlug = "peoria" }: { defaultCitySlug?: string }) {
  const [shelfPriceRaw, setShelfPriceRaw] = useState<string>("");
  const [tier, setTier] = useState<ThcTier>("flower");
  const [citySlug, setCitySlug] = useState<string>(defaultCitySlug);
  const cityRates = useMemo(() => findCityRates(citySlug) ?? CITY_TAX_RATES[0], [citySlug]);

  const shelfPrice = useMemo(() => {
    const cleaned = shelfPriceRaw.replace(/[^0-9.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }, [shelfPriceRaw]);

  const result = useMemo(
    () => calculateOutTheDoor(shelfPrice, tier, cityRates),
    [shelfPrice, tier, cityRates]
  );

  const showOutput = shelfPrice > 0;
  const exciseRate = STATE_EXCISE_RATES[tier];

  // Track view + calculation events without leaking shelf price.
  useEffect(() => {
    try {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (typeof w.gtag === "function") {
        w.gtag("event", "tax_calculator_viewed");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!showOutput) return;
    const bucket =
      shelfPrice <= 25 ? "0-25" : shelfPrice <= 50 ? "25-50" : shelfPrice <= 100 ? "50-100" : "100+";
    try {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (typeof w.gtag === "function") {
        w.gtag("event", "tax_calculator_calculated", {
          shelf_price_bucket: bucket,
          tier,
          city: cityRates.slug,
        });
      }
    } catch {}
  }, [showOutput, shelfPrice, tier, cityRates.slug]);

  return (
    <form
      className="calc"
      aria-label="Illinois cannabis tax calculator"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="calc-row">
        <label className="calc-field">
          <span className="calc-label">Shelf price</span>
          <span className="calc-input-wrap">
            <span className="calc-input-prefix" aria-hidden="true">$</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={shelfPriceRaw}
              onChange={(e) => setShelfPriceRaw(e.target.value)}
              className="calc-input"
              aria-label="Shelf price in dollars"
            />
          </span>
        </label>

        <fieldset className="calc-field calc-tier-field">
          <legend className="calc-label">Product type</legend>
          <div className="calc-tier-row" role="radiogroup">
            {(Object.keys(TIER_LABELS) as ThcTier[]).map((t) => (
              <label
                key={t}
                className={`calc-tier ${tier === t ? "is-active" : ""}`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={t}
                  checked={tier === t}
                  onChange={() => setTier(t)}
                  className="calc-tier-input"
                />
                <span className="calc-tier-title">{TIER_LABELS[t].title}</span>
                <span className="calc-tier-sub">{TIER_LABELS[t].sub}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="calc-field">
          <span className="calc-label">City</span>
          <select
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            className="calc-select"
            aria-label="Dispensary city"
          >
            {CITY_TAX_RATES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.city}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className={`calc-output ${showOutput ? "is-on" : "is-empty"}`}
        aria-live="polite"
      >
        {!showOutput ? (
          <p className="calc-output-empty">
            Enter a shelf price to see what you&apos;ll pay at the register.
          </p>
        ) : (
          <>
            <div className="calc-output-hero">
              <span className="calc-output-label">Out-the-door</span>
              <span className="calc-output-amount">{formatUsd(result.outTheDoor)}</span>
              <span className="calc-output-effective">
                {formatPercent(result.effectiveRate, 1)} effective tax
              </span>
            </div>

            <dl className="calc-breakdown">
              <div className="calc-row-line">
                <dt>Shelf price</dt>
                <dd className="num">{formatUsd(result.shelfPrice)}</dd>
              </div>
              <div className="calc-row-line">
                <dt>
                  Cannabis Excise <span className="calc-pct">({formatPercent(exciseRate, 0)})</span>
                </dt>
                <dd className="num">+ {formatUsd(result.cannabisExcise)}</dd>
              </div>
              <div className="calc-row-line">
                <dt>
                  State Sales Tax <span className="calc-pct">({formatPercent(cityRates.stateSalesTax, 2)})</span>
                </dt>
                <dd className="num">+ {formatUsd(result.stateSalesTax)}</dd>
              </div>
              <div className="calc-row-line">
                <dt>
                  Local Sales Tax <span className="calc-pct">({formatPercent(cityRates.localSalesTax, 2)})</span>
                </dt>
                <dd className="num">+ {formatUsd(result.localSalesTax)}</dd>
              </div>
              <div className="calc-row-line">
                <dt>
                  {cityRates.county} County Cannabis ROT <span className="calc-pct">({formatPercent(cityRates.countyCannabisRot, 2)})</span>
                </dt>
                <dd className="num">+ {formatUsd(result.countyCannabisTax)}</dd>
              </div>
              <div className="calc-row-line">
                <dt>
                  {cityRates.city} Cannabis ROT <span className="calc-pct">({formatPercent(cityRates.municipalCannabisRot, 2)})</span>
                </dt>
                <dd className="num">+ {formatUsd(result.municipalCannabisTax)}</dd>
              </div>
              <div className="calc-row-line calc-row-total">
                <dt>Total tax</dt>
                <dd className="num">{formatUsd(result.totalTax)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      <p className="calc-fresh">
        Tax rates current as of {TAX_RATES_LAST_UPDATED}. County and city rates change quarterly; we update them when they do.
      </p>

      <style>{`
        .calc{
          background:#fff;
          border:1px solid #e8e4da;
          border-radius:14px;
          padding:24px;
          box-shadow:0 1px 3px rgba(15,31,61,0.04), 0 8px 24px rgba(15,31,61,0.06);
        }
        @media(min-width:720px){.calc{padding:32px}}

        .calc-row{
          display:grid;grid-template-columns:1fr;gap:18px;margin-bottom:24px;
        }
        @media(min-width:720px){
          .calc-row{grid-template-columns:1fr 1fr;gap:20px}
          .calc-tier-field{grid-column:1 / -1}
        }

        .calc-field{
          display:flex;flex-direction:column;gap:8px;
          border:none;padding:0;margin:0;
        }
        .calc-label{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.78rem;font-weight:700;letter-spacing:.06em;
          text-transform:uppercase;color:#6b7280;
        }
        .calc-input-wrap{
          display:flex;align-items:center;
          background:#F7F4ED;border:1px solid #e8e4da;border-radius:10px;
          padding:0 14px;height:52px;
        }
        .calc-input-wrap:focus-within{
          background:#fff;border-color:#7DBA47;
          box-shadow:0 0 0 3px rgba(22,163,74,.12);
        }
        .calc-input-prefix{
          color:#6b7280;font-family:var(--font-display, var(--font-geist-sans));
          font-weight:700;font-size:1.1rem;margin-right:6px;
        }
        .calc-input{
          flex:1;border:none;background:transparent;outline:none;
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:1.15rem;font-weight:600;color:#1F3D2B;
          font-variant-numeric:tabular-nums;
        }
        .calc-select{
          height:52px;padding:0 14px;
          background:#F7F4ED;border:1px solid #e8e4da;border-radius:10px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:1rem;font-weight:600;color:#1F3D2B;
          appearance:none;
          background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'><path d='M3 5l4 4 4-4' stroke='%236b7280' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-position:right 14px center;background-repeat:no-repeat;
          padding-right:36px;cursor:pointer;
        }
        .calc-select:focus{outline:none;border-color:#7DBA47;box-shadow:0 0 0 3px rgba(22,163,74,.12);background-color:#fff}

        .calc-tier-row{
          display:grid;grid-template-columns:1fr;gap:8px;
        }
        @media(min-width:560px){
          .calc-tier-row{grid-template-columns:repeat(3,1fr)}
        }
        .calc-tier{
          display:flex;flex-direction:column;gap:2px;
          padding:12px 14px;border:1px solid #e8e4da;border-radius:10px;
          cursor:pointer;background:#F7F4ED;
          transition:all 150ms ease;
          min-height:60px;
        }
        .calc-tier:hover{background:#fff}
        .calc-tier.is-active{
          background:#fff;border-color:#7DBA47;
          box-shadow:0 0 0 2px rgba(22,163,74,0.15);
        }
        .calc-tier-input{position:absolute;opacity:0;pointer-events:none}
        .calc-tier-title{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;font-weight:700;color:#1F3D2B;
        }
        .calc-tier-sub{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.74rem;color:#6b7280;
          font-variant-numeric:tabular-nums;
        }

        .calc-output{
          background:#F7F4ED;border:1px solid #e8e4da;border-radius:12px;
          padding:24px;
        }
        @media(min-width:720px){.calc-output{padding:28px}}

        .calc-output.is-empty{
          padding:32px 24px;text-align:center;
        }
        .calc-output-empty{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.95rem;color:#6b7280;
          margin:0;
        }

        .calc-output-hero{
          display:grid;grid-template-columns:1fr;gap:4px;
          padding-bottom:18px;margin-bottom:18px;
          border-bottom:1px solid #e8e4da;
          align-items:baseline;
        }
        @media(min-width:560px){
          .calc-output-hero{
            grid-template-columns:auto 1fr auto;gap:14px;
          }
        }
        .calc-output-label{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.74rem;font-weight:700;letter-spacing:.1em;
          text-transform:uppercase;color:#6b7280;
        }
        .calc-output-amount{
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(1.8rem, 5vw, 2.5rem);
          font-weight:700;color:#1F3D2B;
          letter-spacing:-.03em;
          font-variant-numeric:tabular-nums;
          line-height:1;
        }
        .calc-output-effective{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.78rem;font-weight:600;
          color:#7DBA47;background:#F2F8E9;
          padding:4px 10px;border-radius:100px;
          justify-self:start;
        }
        @media(min-width:560px){.calc-output-effective{justify-self:end}}

        .calc-breakdown{margin:0;padding:0}
        .calc-row-line{
          display:flex;justify-content:space-between;align-items:baseline;
          padding:8px 0;
          border-bottom:1px dashed #e8e4da;
        }
        .calc-row-line:last-child{border-bottom:none}
        .calc-row-line dt{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;color:#374151;
        }
        .calc-pct{
          font-size:.78rem;color:#9ca3af;
          font-variant-numeric:tabular-nums;
          margin-left:4px;
        }
        .calc-row-line dd.num{
          font-family:var(--font-display, var(--font-geist-sans));
          font-weight:600;font-size:.95rem;color:#1F3D2B;
          font-variant-numeric:tabular-nums;
          margin:0;
        }
        .calc-row-total{padding-top:14px;margin-top:6px;border-top:1px solid #e8e4da}
        .calc-row-total dt{font-weight:700;color:#1F3D2B}
        .calc-row-total dd.num{font-size:1.1rem;font-weight:700}

        .calc-fresh{
          margin-top:18px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.78rem;color:#9ca3af;
          font-style:italic;
          text-align:center;
        }
      `}</style>
    </form>
  );
}
