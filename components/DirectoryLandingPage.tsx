"use client";

import { useState, FormEvent } from "react";
import { submitLead } from "@/lib/submitLead";
import type { DirectoryConfig } from "@/config/directories/project-green";

// Re-export so consumers can reference the type from this file if needed
export type { DirectoryConfig };

interface Props {
  config: DirectoryConfig;
}

export default function DirectoryLandingPage({ config }: Props) {
  const {
    directoryName,
    heroHeadline,
    heroSubheadline,
    accentColor,
    stats,
    benefits,
    pricingTiers,
    niche,
    region,
    source,
  } = config;

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState(pricingTiers[0]?.name ?? "");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      await submitLead({
        business_name: String(data.get("business_name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? "") || undefined,
        tier_interest: String(data.get("tier_interest") ?? ""),
        niche,
        region,
        source,
      });
      setStatus("success");
      form.reset();
      setSelectedTier(pricingTiers[0]?.name ?? "");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#050f09] text-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-[#050f09]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold tracking-tight" style={{ color: accentColor }}>
            {directoryName}
          </span>
          <a
            href="#get-listed"
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-[#050f09] shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Get listed
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
          style={{ borderColor: `${accentColor}40`, color: accentColor, backgroundColor: `${accentColor}15` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          {region} Cannabis Directory
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
          {heroHeadline}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
          {heroSubheadline}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#get-listed"
            className="inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold text-[#050f09] shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Claim your listing
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center rounded-full border border-white/10 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
          >
            See pricing
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-white/5 px-4">
          {stats.map((stat) => (
            <div key={stat.label} className="py-8 text-center">
              <div className="text-2xl font-semibold md:text-3xl" style={{ color: accentColor }}>
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-400 md:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-2 text-center text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">
          Why operators choose {directoryName}
        </h2>
        <p className="mb-10 text-center text-sm text-slate-400">
          Built for {region}&apos;s cannabis market — not a generic business directory.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"
            >
              <div className="mb-1 text-sm font-semibold" style={{ color: accentColor }}>
                {b.title}
              </div>
              <p className="text-xs leading-relaxed text-slate-300 md:text-sm">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-2 text-center text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">
            Simple pricing
          </h2>
          <p className="mb-10 text-center text-sm text-slate-400">
            Start free. Upgrade when you&apos;re ready to grow.
          </p>

          <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-2">
            {pricingTiers.map((tier, i) => {
              const isHighlighted = i === 1;
              return (
                <div
                  key={tier.name}
                  className="rounded-2xl border p-6"
                  style={
                    isHighlighted
                      ? { borderColor: accentColor, backgroundColor: `${accentColor}10` }
                      : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }
                  }
                >
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {tier.name}
                  </div>
                  <div
                    className="mb-1 text-3xl font-bold"
                    style={{ color: isHighlighted ? accentColor : "white" }}
                  >
                    {tier.price}
                  </div>
                  <p className="mb-4 text-xs text-slate-400">{tier.description}</p>
                  <ul className="mb-6 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-200 md:text-sm">
                        <span style={{ color: accentColor }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#get-listed"
                    onClick={() => setSelectedTier(tier.name)}
                    className="block w-full rounded-full py-2 text-center text-sm font-semibold transition hover:opacity-90"
                    style={
                      isHighlighted
                        ? { backgroundColor: accentColor, color: "#050f09" }
                        : { border: `1px solid ${accentColor}`, color: accentColor }
                    }
                  >
                    {tier.cta}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lead capture form */}
      <section id="get-listed" className="border-t border-white/5">
        <div className="mx-auto max-w-lg px-4 py-16">
          {status === "success" ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                ✓
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-50">You&apos;re on the list</h3>
              <p className="text-sm text-slate-300">
                We&apos;ll review your submission and follow up within 1–2 business days.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-center text-xl font-semibold text-slate-50 md:text-2xl">
                Get listed in {directoryName}
              </h2>
              <p className="mb-8 text-center text-sm text-slate-400">
                Tell us about your business. We&apos;ll review and reach out with next steps.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Business name */}
                <div className="space-y-1.5">
                  <label htmlFor="business_name" className="block text-xs font-medium text-slate-300">
                    Business name <span style={{ color: accentColor }}>*</span>
                  </label>
                  <input
                    id="business_name"
                    name="business_name"
                    required
                    placeholder="Green Leaf Dispensary"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-slate-300">
                    Email <span style={{ color: accentColor }}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  />
                </div>

                {/* Phone (optional) */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-medium text-slate-300">
                    Phone <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(312) 555-0100"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  />
                </div>

                {/* Tier interest */}
                <div className="space-y-1.5">
                  <label htmlFor="tier_interest" className="block text-xs font-medium text-slate-300">
                    I&apos;m interested in
                  </label>
                  <select
                    id="tier_interest"
                    name="tier_interest"
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#050f09] px-3 py-2 text-sm text-slate-50 focus:border-white/20 focus:outline-none focus:ring-1"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  >
                    {pricingTiers.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} — {t.price}
                      </option>
                    ))}
                  </select>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-400">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full rounded-full py-2.5 text-sm font-semibold text-[#050f09] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: accentColor }}
                >
                  {status === "submitting" ? "Submitting…" : "Submit request"}
                </button>

                <p className="text-center text-[11px] text-slate-500">
                  We&apos;ll never sell your data. Used only to review your listing request.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 text-xs text-slate-500">
          <span>{directoryName} · {region} Cannabis Directory</span>
          <div className="flex items-center gap-4">
            <a href="/cannabis/illinois" className="hover:text-slate-300 transition-colors">
              Illinois City Guides →
            </a>
            <a href="/" className="hover:text-slate-300 transition-colors">
              CleanList →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
