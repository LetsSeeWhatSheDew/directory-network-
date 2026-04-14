"use client";

import { useEffect } from "react";

export default function SearchTracker() {
  useEffect(() => {
    const forms = document.querySelectorAll<HTMLFormElement>('form[action="/search"]');
    if (!forms.length) return;
    const handler = (e: Event) => {
      const form = e.currentTarget as HTMLFormElement;
      const input = form.querySelector<HTMLInputElement>('input[name="q"]');
      const q = input?.value?.trim();
      if (!q) return;
      try {
        const w = window as any;
        if (typeof w.gtag === "function") {
          w.gtag("event", "search", { search_term: q });
        }
      } catch {}
    };
    forms.forEach((f) => f.addEventListener("submit", handler));
    return () => forms.forEach((f) => f.removeEventListener("submit", handler));
  }, []);
  return null;
}
