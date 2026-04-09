"use client";

import { useState, FormEvent } from "react";

interface Props {
  city: string;
  state: string;
}

export default function CityEmailCapture({ city, state }: Props) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: `Newsletter: ${city}, ${state}`,
          email: String(data.get("email") ?? ""),
          tier_interest: "newsletter",
          niche: "cannabis",
          region: state,
          source: `city-page-${city.toLowerCase().replace(/\s+/g, "-")}`,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-[#7FE3C7]/30 bg-[#7FE3C7]/10 p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#7FE3C7]/20 text-lg text-[#7FE3C7]">
          ✓
        </div>
        <p className="text-sm font-semibold text-slate-100">
          You&apos;re on the list
        </p>
        <p className="mt-1 text-xs text-slate-400">
          We&apos;ll send {city} dispensary updates straight to your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="mb-1 text-sm font-semibold text-slate-100">
        Stay updated on {city} cannabis
      </h3>
      <p className="mb-4 text-xs text-slate-400">
        New dispensary openings, law changes, and deals — delivered when it
        matters.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-[#7FE3C7]"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-[#7FE3C7] px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-[#6ad3b7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "…" : "Subscribe"}
        </button>
      </form>

      {errorMsg && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}

      <p className="mt-3 text-[10px] text-slate-500">
        No spam. Unsubscribe anytime. We never share your email.
      </p>
    </div>
  );
}
