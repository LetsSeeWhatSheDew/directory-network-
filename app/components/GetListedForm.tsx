"use client";

import { useState, FormEvent } from "react";

const DIRECTORY_OPTIONS = [
  { value: "green", label: "PuffPrice · Cannabis" },
  { value: "heal", label: "Project Heal · Holistic" },
  { value: "her", label: "Project Her · Women’s Wellness" },
  { value: "machine", label: "Project Machine · AI Tools" },
  { value: "bid", label: "Project Bid · Gov Contractors" },
  { value: "rent", label: "Project Rent · FSBO Rentals" },
];

export function GetListedForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const directory = String(formData.get("directory") || "");
    const business_name = String(formData.get("business_name") || "");
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const website = String(formData.get("website") || "");
    const message = String(formData.get("message") || "");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "new_listing",
          directory,
          business_name,
          name,
          email,
          website,
          company: website,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {/* The page owns the h1 ("List your dispensary"); this is the form's section title. */}
        <h2 data-keep-font className="text-xl font-semibold tracking-tight text-[color:var(--pp-ink)] md:text-2xl">
          Get listed on PuffPrice
        </h2>
        <p className="text-sm text-[color:var(--pp-body)]">
          Tell us about your business and which directory you belong in. We&apos;ll
          review and follow up with next steps within 1–2 business days.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs md:text-sm">
        {/* Directory */}
        <div className="space-y-1.5">
          <label className="block text-[color:var(--pp-body)]" htmlFor="directory">
            Which directory should this appear in?
          </label>
          <select
            id="directory"
            name="directory"
            required
            className="w-full rounded-md border border-[color:var(--pp-border)] bg-[color:var(--pp-surface)] px-2 py-1.5 text-sm text-[color:var(--pp-ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pp-signal)]/40 focus:border-[color:var(--pp-signal)]"
            defaultValue=""
          >
            <option value="" disabled>
              Select a directory…
            </option>
            {DIRECTORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Business name + website */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[color:var(--pp-body)]" htmlFor="business_name">
              Business name
            </label>
            <input
              id="business_name"
              name="business_name"
              required
              className="w-full rounded-md border border-[color:var(--pp-border)] bg-[color:var(--pp-surface)] px-2 py-1.5 text-sm text-[color:var(--pp-ink)] placeholder:text-[color:var(--pp-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pp-signal)]/40 focus:border-[color:var(--pp-signal)]"
              placeholder="Mile High Greens"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[color:var(--pp-body)]" htmlFor="website">
              Website (optional)
            </label>
            <input
              id="website"
              name="website"
              className="w-full rounded-md border border-[color:var(--pp-border)] bg-[color:var(--pp-surface)] px-2 py-1.5 text-sm text-[color:var(--pp-ink)] placeholder:text-[color:var(--pp-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pp-signal)]/40 focus:border-[color:var(--pp-signal)]"
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Contact name + email */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[color:var(--pp-body)]" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-md border border-[color:var(--pp-border)] bg-[color:var(--pp-surface)] px-2 py-1.5 text-sm text-[color:var(--pp-ink)] placeholder:text-[color:var(--pp-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pp-signal)]/40 focus:border-[color:var(--pp-signal)]"
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[color:var(--pp-body)]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-[color:var(--pp-border)] bg-[color:var(--pp-surface)] px-2 py-1.5 text-sm text-[color:var(--pp-ink)] placeholder:text-[color:var(--pp-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pp-signal)]/40 focus:border-[color:var(--pp-signal)]"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="block text-[color:var(--pp-body)]" htmlFor="message">
            Anything else we should know?
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="w-full rounded-md border border-[color:var(--pp-border)] bg-[color:var(--pp-surface)] px-2 py-1.5 text-sm text-[color:var(--pp-ink)] placeholder:text-[color:var(--pp-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pp-signal)]/40 focus:border-[color:var(--pp-signal)]"
            placeholder="Licensing info, specialties, service area, or how you heard about us."
          />
        </div>

        {/* Actions / status */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center rounded-full border border-[color:var(--pp-btn-border)] bg-[color:var(--pp-btn)] px-5 py-2.5 text-sm font-semibold text-[color:var(--pp-btn-fg)] hover:brightness-[.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "submitting" ? "Submitting…" : "Submit request"}
          </button>
          <p className="text-[11px] text-[color:var(--pp-muted)]">
            We&apos;ll never sell your data. We only use this info to review your
            listing request.
          </p>
        </div>

        {status === "success" && (
          <p className="text-[11px] text-[color:var(--pp-mark)]">
            Got it. Your request was submitted — we&apos;ll review and follow up.
          </p>
        )}
        {status === "error" && (
          <p className="text-[11px] text-[color:var(--pp-stop-fg)]">{error}</p>
        )}
      </form>
    </div>
  );
}