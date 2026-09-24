"use client";

import { useEffect, useRef, useState } from "react";

type Match = { slug: string; name: string; city: string | null };

export default function DispensaryAutocomplete({
  value,
  onSelect,
  style,
  placeholder,
}: {
  value: string;
  onSelect: (m: Match) => void;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [matches, setMatches] = useState<Match[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/listings/search?q=${encodeURIComponent(term)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setMatches(Array.isArray(data?.listings) ? data.listings.slice(0, 8) : []);
        }
      } catch {}
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "Type your dispensary name"}
        style={style}
        autoComplete="off"
      />
      {open && (matches.length > 0 || loading) && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            marginTop: 4,
            background: "var(--pp-surface)",
            border: "1px solid var(--pp-border)",
            borderRadius: 10,
            boxShadow: "0 6px 18px rgba(15,31,61,.08)",
            zIndex: 10,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {loading && (
            <div style={{ padding: "10px 14px", fontSize: ".8rem", color: "var(--pp-muted)", fontFamily: "var(--font-body)" }}>
              Searching…
            </div>
          )}
          {matches.map((m) => (
            <button
              key={m.slug}
              type="button"
              onClick={() => {
                onSelect(m);
                setQuery(m.name);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                border: "none",
                borderBottom: "1px solid #f1ede3",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <div style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--pp-ink)" }}>{m.name}</div>
              <div style={{ fontSize: ".75rem", color: "var(--pp-muted)" }}>
                {m.city ? `${m.city}, IL · ${m.slug}` : m.slug}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
