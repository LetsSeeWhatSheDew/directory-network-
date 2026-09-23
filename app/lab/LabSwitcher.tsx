// Floating switcher for the design previews.
import Link from "next/link";
const DIRS = [["a", "Ticker"], ["b", "Local paper"], ["c", "Night drive"], ["d", "Breathe"]] as const;
export default function LabSwitcher({ current }: { current: string }) {
  return (
    <nav aria-label="Design previews" style={{ position: "fixed", left: "50%", bottom: 14, transform: "translateX(-50%)", zIndex: 1000, display: "flex", gap: 4, padding: 4, maxWidth: "96vw", overflowX: "auto", borderRadius: 999, background: "rgba(20,20,20,.86)", backdropFilter: "blur(8px)", boxShadow: "0 6px 24px rgba(0,0,0,.25)", fontFamily: "system-ui,sans-serif" }}>
      {DIRS.map(([k, label]) => (
        <Link key={k} href={`/lab/${k}`} style={{ padding: "8px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", color: current === k ? "#111" : "#eee", background: current === k ? "#fff" : "transparent" }}>
          {k.toUpperCase()} · {label}
        </Link>
      ))}
    </nav>
  );
}
