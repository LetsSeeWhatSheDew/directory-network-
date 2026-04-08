"use client";

import { useState, FormEvent } from "react";

interface ClaimFormProps {
  listingId: string;
  projectTag: string;
  listingTitle: string;
}

export default function ClaimForm({ listingId, projectTag, listingTitle }: ClaimFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          project_tag: projectTag,
          listing_name: listingTitle,
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setStatus("success");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-emerald-600">
        Request submitted — we&apos;ll review and follow up with next steps.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Claim this listing / Get featured
      </h2>
      <p className="text-xs text-zinc-500">
        Tell us how you&apos;re connected to{" "}
        <span className="font-medium text-zinc-900">{listingTitle}</span>.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="claim-name" className="block text-xs font-medium text-slate-700">
          Your name
        </label>
        <input
          id="claim-name"
          name="name"
          required
          placeholder="Jane Doe"
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D1B69]/40"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="claim-email" className="block text-xs font-medium text-slate-700">
          Email
        </label>
        <input
          id="claim-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D1B69]/40"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="claim-message" className="block text-xs font-medium text-slate-700">
          How are you connected to this listing?
        </label>
        <textarea
          id="claim-message"
          name="message"
          rows={3}
          placeholder="Owner, manager, licensing contact…"
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D1B69]/40"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center rounded-full bg-[#2D1B69] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#221450] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit claim"}
      </button>
    </form>
  );
}
