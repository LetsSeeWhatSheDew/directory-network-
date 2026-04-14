import Link from "next/link";

// ============================================================
// CLEANLIST HOMEPAGE — Cannabis visual identity overhaul
//
// Design philosophy:
// - Unmistakably cannabis within 1 second of landing
// - Real SVG icons, not emoji fallbacks
// - Botanical plant illustrations in hero background (low opacity)
// - Dark navy + green = authority + cannabis without cliché
// - Georgia serif = trustworthy local guide, not tech startup
// ============================================================

// ---------- SVG ICON COMPONENTS ----------

// 7-blade cannabis leaf — universal cannabis symbol
function LeafIcon({ size = 20, color = "#4ade80" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* stem */}
      <path d="M32 60 L32 44" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* center blade (tallest) */}
      <path d="M32 44 Q30 28 32 4 Q34 28 32 44 M30 14 L26 16 M34 14 L38 16 M30 22 L25 24 M34 22 L39 24 M30 30 L24 33 M34 30 L40 33" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.55" strokeLinejoin="round" />
      {/* upper-left blade */}
      <path d="M32 44 Q20 32 10 14 Q22 28 32 44 M15 18 L11 22 M19 22 L15 26 M23 26 L20 30" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.5" strokeLinejoin="round" />
      {/* upper-right blade */}
      <path d="M32 44 Q44 32 54 14 Q42 28 32 44 M49 18 L53 22 M45 22 L49 26 M41 26 L44 30" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.5" strokeLinejoin="round" />
      {/* mid-left blade (widest) */}
      <path d="M32 44 Q14 40 2 30 Q18 40 32 44 M10 34 L7 38 M16 36 L13 40 M22 40 L20 43" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.45" strokeLinejoin="round" />
      {/* mid-right blade (widest) */}
      <path d="M32 44 Q50 40 62 30 Q46 40 32 44 M54 34 L57 38 M48 36 L51 40 M42 40 L44 43" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.45" strokeLinejoin="round" />
      {/* lower-left blade (short) */}
      <path d="M32 44 Q22 48 12 50 Q24 46 32 44" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.4" strokeLinejoin="round" />
      {/* lower-right blade (short) */}
      <path d="M32 44 Q42 48 52 50 Q40 46 32 44" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.4" strokeLinejoin="round" />
    </svg>
  );
}

// Gummy bear — edibles icon
function GummyBearIcon({ size = 20 }) {
  const color = "#fb923c";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* left ear */}
      <circle cx="20" cy="14" r="6" fill={color} />
      {/* right ear */}
      <circle cx="44" cy="14" r="6" fill={color} />
      {/* head */}
      <circle cx="32" cy="22" r="10" fill={color} />
      {/* torso */}
      <ellipse cx="32" cy="40" rx="13" ry="14" fill={color} />
      {/* left arm */}
      <ellipse cx="16" cy="36" rx="5" ry="6" fill={color} />
      {/* right arm */}
      <ellipse cx="48" cy="36" rx="5" ry="6" fill={color} />
      {/* left leg */}
      <ellipse cx="24" cy="56" rx="5" ry="5" fill={color} />
      {/* right leg */}
      <ellipse cx="40" cy="56" rx="5" ry="5" fill={color} />
      {/* eyes */}
      <circle cx="28" cy="20" r="1.4" fill="#0f1f3d" />
      <circle cx="36" cy="20" r="1.4" fill="#0f1f3d" />
      {/* smile */}
      <path d="M28 25 Q32 28 36 25" stroke="#0f1f3d" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Vape pen — sleek cartridge with oil window
function VapeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* mouthpiece */}
      <rect x="28" y="4" width="8" height="8" rx="1.5" fill="#1f2937" />
      {/* upper cartridge body */}
      <rect x="24" y="12" width="16" height="22" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      {/* oil window */}
      <rect x="27" y="16" width="10" height="14" rx="1" fill="#fbbf24" />
      {/* metal band */}
      <rect x="23" y="34" width="18" height="4" rx="1" fill="#9ca3af" />
      {/* battery body */}
      <rect x="24" y="38" width="16" height="20" rx="2" fill="#0f1f3d" />
      {/* LED button */}
      <circle cx="32" cy="52" r="2.2" fill="#16a34a" />
      <circle cx="32" cy="52" r="1" fill="#4ade80" />
    </svg>
  );
}

// Concentrate crystal — faceted gem / water drop
function ConcentrateIcon({ size = 20 }) {
  const color = "#a78bfa";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* outer crystal teardrop */}
      <path d="M32 6 L50 32 Q50 54 32 58 Q14 54 14 32 Z" fill={color} fillOpacity="0.85" stroke="#7c3aed" strokeWidth="1.2" strokeLinejoin="round" />
      {/* internal facet lines */}
      <path d="M32 6 L32 58" stroke="#c4b5fd" strokeWidth="0.8" />
      <path d="M14 32 L50 32" stroke="#c4b5fd" strokeWidth="0.8" />
      <path d="M22 18 L42 46" stroke="#c4b5fd" strokeWidth="0.7" />
      <path d="M42 18 L22 46" stroke="#c4b5fd" strokeWidth="0.7" />
      {/* highlight */}
      <path d="M26 14 L22 24" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

// Flame — all deals icon
function FlameIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* outer flame (white on green bg) */}
      <path d="M32 6 C36 18 48 24 48 40 C48 52 40 58 32 58 C24 58 16 52 16 40 C16 30 22 26 24 20 C26 26 30 22 32 6 Z" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
      {/* inner flame */}
      <path d="M32 22 C34 28 40 32 40 42 C40 50 36 54 32 54 C28 54 24 50 24 42 C24 36 28 34 29 30 C30 34 31 32 32 22 Z" fill="#fb923c" />
      {/* core */}
      <path d="M32 34 C33 38 36 40 36 45 C36 49 34 51 32 51 C30 51 28 49 28 45 C28 41 30 41 32 34 Z" fill="#fbbf24" />
    </svg>
  );
}

// Large decorative cannabis plant — hero background
function PlantSilhouette({ side = "left" }) {
  const transform = side === "right" ? "scale(-1,1) translate(-200,0)" : "";
  return (
    <svg
      width="200"
      height="500"
      viewBox="0 0 200 500"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        top: "0",
        [side]: "-20px",
        opacity: 0.13,
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <g transform={transform} fill="#4ade80" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round">
        {/* main stalk */}
        <path d="M100 500 L100 60" stroke="#4ade80" strokeWidth="3" fill="none" />
        {/* upper fan leaf cluster (5 blades) */}
        <g transform="translate(100 80)">
          <path d="M0 0 Q-4 -30 -2 -60 Q2 -30 0 0" />
          <path d="M0 0 Q-20 -20 -35 -45 Q-12 -15 0 0" />
          <path d="M0 0 Q20 -20 35 -45 Q12 -15 0 0" />
          <path d="M0 0 Q-30 -8 -50 -20 Q-20 -5 0 0" />
          <path d="M0 0 Q30 -8 50 -20 Q20 -5 0 0" />
        </g>
        {/* mid-upper branch + cluster */}
        <path d="M100 160 Q80 155 60 150" stroke="#4ade80" strokeWidth="2" fill="none" />
        <g transform="translate(55 148)">
          <path d="M0 0 Q-4 -24 -2 -48 Q2 -24 0 0" />
          <path d="M0 0 Q-18 -14 -30 -34 Q-10 -10 0 0" />
          <path d="M0 0 Q18 -14 30 -34 Q10 -10 0 0" />
          <path d="M0 0 Q-26 -4 -44 -14 Q-18 -2 0 0" />
          <path d="M0 0 Q26 -4 44 -14 Q18 -2 0 0" />
          <path d="M0 0 Q-10 12 -18 22 Q-6 8 0 0" />
          <path d="M0 0 Q10 12 18 22 Q6 8 0 0" />
        </g>
        {/* mid-lower branch + cluster (other side) */}
        <path d="M100 240 Q120 236 140 230" stroke="#4ade80" strokeWidth="2" fill="none" />
        <g transform="translate(145 228)">
          <path d="M0 0 Q-4 -24 -2 -48 Q2 -24 0 0" />
          <path d="M0 0 Q-18 -14 -30 -34 Q-10 -10 0 0" />
          <path d="M0 0 Q18 -14 30 -34 Q10 -10 0 0" />
          <path d="M0 0 Q-26 -4 -44 -14 Q-18 -2 0 0" />
          <path d="M0 0 Q26 -4 44 -14 Q18 -2 0 0" />
          <path d="M0 0 Q-10 12 -18 22 Q-6 8 0 0" />
          <path d="M0 0 Q10 12 18 22 Q6 8 0 0" />
        </g>
        {/* lower branch + cluster */}
        <path d="M100 330 Q78 326 56 320" stroke="#4ade80" strokeWidth="2" fill="none" />
        <g transform="translate(50 318)">
          <path d="M0 0 Q-4 -20 -2 -40 Q2 -20 0 0" />
          <path d="M0 0 Q-16 -12 -26 -28 Q-10 -8 0 0" />
          <path d="M0 0 Q16 -12 26 -28 Q10 -8 0 0" />
          <path d="M0 0 Q-22 -3 -36 -10 Q-16 -2 0 0" />
          <path d="M0 0 Q22 -3 36 -10 Q16 -2 0 0" />
        </g>
        {/* bottom branch */}
        <path d="M100 410 Q118 408 138 404" stroke="#4ade80" strokeWidth="2" fill="none" />
        <g transform="translate(140 402)">
          <path d="M0 0 Q-4 -18 -2 -34 Q2 -18 0 0" />
          <path d="M0 0 Q-14 -10 -22 -22 Q-8 -7 0 0" />
          <path d="M0 0 Q14 -10 22 -22 Q8 -7 0 0" />
          <path d="M0 0 Q-18 -2 -30 -8 Q-14 -1 0 0" />
          <path d="M0 0 Q18 -2 30 -8 Q14 -1 0 0" />
        </g>
      </g>
    </svg>
  );
}

// ---------- DATA ----------

const CATEGORIES = [
  { label: "Flower", slug: "flower", icon: "leaf" },
  { label: "Edibles", slug: "edibles", icon: "gummy" },
  { label: "Vapes", slug: "vapes", icon: "vape" },
  { label: "Concentrates", slug: "concentrate", icon: "crystal" },
  { label: "All deals", slug: "all", icon: "flame" },
];

const QUICK_FILTERS = [
  { label: "Open now", param: "open=true" },
  { label: "Drive-thru", param: "drivethu=true" },
  { label: "Cards accepted", param: "credit=true" },
  { label: "Best rated", param: "sort=rated" },
];

const CITIES = [
  { name: "Chicago", slug: "chicago" },
  { name: "Peoria", slug: "peoria" },
  { name: "Springfield", slug: "springfield" },
  { name: "Champaign", slug: "champaign" },
  { name: "Normal", slug: "normal" },
  { name: "Naperville", slug: "naperville" },
  { name: "Joliet", slug: "joliet" },
  { name: "Rockford", slug: "rockford" },
  { name: "Waukegan", slug: "waukegan" },
  { name: "Elgin", slug: "elgin" },
  { name: "Schaumburg", slug: "schaumburg" },
  { name: "Aurora", slug: "aurora" },
];

function renderIcon(key) {
  if (key === "leaf") return <LeafIcon />;
  if (key === "gummy") return <GummyBearIcon />;
  if (key === "vape") return <VapeIcon />;
  if (key === "crystal") return <ConcentrateIcon />;
  if (key === "flame") return <FlameIcon />;
  return null;
}

export default function HomePage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:Georgia,serif;background:#f5f4f0;min-height:100vh;color:#0f1f3d}

        /* NAV */
        .nav{
          display:flex;justify-content:space-between;align-items:center;
          padding:14px 28px;background:#0f1f3d;
          position:sticky;top:0;z-index:100;
        }
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.9)}}
        .logo-text{font-size:1.15rem;font-weight:700;color:#fff;letter-spacing:-.02em}
        .logo-text span{color:#4ade80}
        .nav-links{display:flex;align-items:center;gap:20px}
        .nav-link{font-size:.82rem;color:rgba(255,255,255,.6);text-decoration:none;font-family:system-ui,sans-serif}
        .nav-link:hover{color:#fff}
        .nav-cta{
          font-size:.82rem;font-family:system-ui,sans-serif;font-weight:600;
          color:#0f1f3d;background:#4ade80;padding:6px 14px;border-radius:6px;
          text-decoration:none;
        }
        .nav-cta:hover{background:#22c55e}

        /* HERO */
        .hero{
          background:#0f1f3d;
          padding:56px 28px 48px;
          text-align:center;
          position:relative;
          overflow:hidden;
        }
        .hero-inner{position:relative;z-index:1}
        .hero-badge{
          display:inline-flex;align-items:center;gap:6px;
          background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.25);
          border-radius:100px;padding:4px 14px;
          font-size:.72rem;font-family:system-ui,sans-serif;
          color:#4ade80;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
          margin-bottom:20px;
        }
        .hero-badge-dot{width:5px;height:5px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite}
        .hero h1{
          font-size:clamp(2rem,5vw,3.2rem);
          font-weight:700;color:#fff;
          letter-spacing:-.04em;line-height:1.1;
          margin-bottom:12px;
        }
        .hero h1 em{color:#4ade80;font-style:normal}
        .hero-sub{
          font-size:1rem;color:rgba(255,255,255,.55);
          font-family:system-ui,sans-serif;
          line-height:1.6;margin-bottom:36px;
          max-width:480px;margin-left:auto;margin-right:auto;
        }

        /* CATEGORY BUTTONS */
        .category-grid{
          display:flex;flex-wrap:wrap;justify-content:center;
          gap:10px;margin-bottom:16px;
          max-width:620px;margin-left:auto;margin-right:auto;
        }
        .cat-btn{
          display:flex;align-items:center;gap:8px;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.15);
          border-radius:10px;padding:12px 20px;
          font-size:.88rem;font-family:system-ui,sans-serif;font-weight:600;
          color:#fff;cursor:pointer;text-decoration:none;
          transition:all .15s;
        }
        .cat-btn:hover{background:rgba(74,222,128,.15);border-color:rgba(74,222,128,.4)}
        .cat-btn.primary{
          background:#16a34a;border-color:#16a34a;
          font-size:.95rem;padding:14px 28px;
        }
        .cat-btn.primary:hover{background:#15803d}
        .cat-btn svg{flex-shrink:0}

        /* QUICK FILTERS */
        .filter-row{
          display:flex;flex-wrap:wrap;justify-content:center;gap:8px;
          margin-top:12px;max-width:480px;
          margin-left:auto;margin-right:auto;
        }
        .filter-pill{
          font-size:.75rem;font-family:system-ui,sans-serif;font-weight:500;
          color:rgba(255,255,255,.5);
          background:transparent;border:1px solid rgba(255,255,255,.15);
          border-radius:100px;padding:4px 12px;
          cursor:pointer;text-decoration:none;
        }
        .filter-pill:hover{color:#fff;border-color:rgba(255,255,255,.4)}

        /* HOW IT WORKS */
        .how{background:#fff;border-top:1px solid #e8e4da;border-bottom:1px solid #e8e4da}
        .how-inner{
          max-width:900px;margin:0 auto;
          padding:52px 28px;
          display:grid;grid-template-columns:repeat(3,1fr);gap:40px;
        }
        .how-num{
          font-size:2.4rem;font-weight:700;color:#e8e4da;
          line-height:1;margin-bottom:10px;
        }
        .how-title{font-size:.95rem;font-weight:700;color:#0f1f3d;margin-bottom:6px}
        .how-desc{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.6}

        /* DEALS SECTION */
        .deals-section{max-width:1100px;margin:0 auto;padding:52px 28px}
        .section-eyebrow{
          font-size:.7rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#16a34a;
          font-family:system-ui,sans-serif;margin-bottom:6px;
        }
        .section-title{
          font-size:clamp(1.4rem,3vw,1.8rem);font-weight:700;
          color:#0f1f3d;letter-spacing:-.03em;margin-bottom:4px;
        }
        .section-sub{
          font-size:.875rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:28px;
        }

        /* DEAL CARDS */
        .deal-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .deal-card{
          background:#fff;border:1px solid #e8e4da;border-radius:14px;
          padding:18px;position:relative;
          transition:border-color .15s;
        }
        .deal-card:hover{border-color:#16a34a}
        .deal-card.top-pick{
          border:2px solid #16a34a;
          background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%);
        }
        .top-pick-badge{
          position:absolute;top:-10px;left:16px;
          background:#16a34a;color:#fff;
          font-size:.68rem;font-family:system-ui,sans-serif;
          font-weight:700;letter-spacing:.08em;text-transform:uppercase;
          padding:3px 10px;border-radius:100px;
        }
        .deal-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
        .deal-name{font-size:.95rem;font-weight:700;color:#0f1f3d}
        .deal-city{font-size:.75rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .open-badge{
          font-size:.68rem;font-weight:600;
          padding:2px 8px;border-radius:100px;
          font-family:system-ui,sans-serif;
          white-space:nowrap;
        }
        .open-badge.open{color:#166534;background:#dcfce7}
        .open-badge.closed{color:#991b1b;background:#fee2e2}
        .deal-highlight{
          font-size:.95rem;font-weight:700;color:#16a34a;
          margin-bottom:6px;
        }
        .deal-reason{
          font-size:.78rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:12px;
          line-height:1.5;
        }
        .deal-attrs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px}
        .deal-attr{
          font-size:.68rem;color:#6b7280;
          background:#f5f4f0;border-radius:100px;
          padding:2px 9px;font-family:system-ui,sans-serif;
        }
        .deal-savings{
          display:flex;align-items:center;justify-content:space-between;
          background:#f0fdf4;border-radius:8px;
          padding:8px 12px;
        }
        .savings-label{font-size:.75rem;color:#166534;font-family:system-ui,sans-serif}
        .savings-num{font-size:1.1rem;font-weight:700;color:#16a34a}

        /* CITY BROWSE */
        .cities-section{background:#0f1f3d;padding:52px 28px}
        .cities-inner{max-width:1100px;margin:0 auto}
        .cities-title{
          font-size:1.5rem;font-weight:700;color:#fff;
          letter-spacing:-.03em;margin-bottom:4px;
        }
        .cities-sub{
          font-size:.875rem;color:rgba(255,255,255,.4);
          font-family:system-ui,sans-serif;margin-bottom:24px;
        }
        .city-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
          gap:10px;
        }
        .city-card{
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.1);
          border-radius:10px;padding:14px;
          text-decoration:none;
          transition:all .15s;
        }
        .city-card:hover{background:rgba(74,222,128,.1);border-color:rgba(74,222,128,.3)}
        .city-name{font-size:.9rem;font-weight:700;color:#fff;margin-bottom:8px}
        .city-pills{display:flex;gap:4px;flex-wrap:wrap}
        .city-pill{
          font-size:.62rem;color:#4ade80;
          background:rgba(74,222,128,.1);
          border:1px solid rgba(74,222,128,.2);
          border-radius:100px;padding:2px 7px;
          font-family:system-ui,sans-serif;text-decoration:none;
        }
        .city-pill:hover{background:rgba(74,222,128,.2)}

        /* BIZ STRIP */
        .biz-strip{
          background:#f5f4f0;border-top:1px solid #e8e4da;
          padding:44px 28px;text-align:center;
        }
        .biz-title{
          font-size:1.25rem;font-weight:700;color:#0f1f3d;
          letter-spacing:-.02em;margin-bottom:6px;
        }
        .biz-sub{
          font-size:.875rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:20px;
          max-width:400px;margin-left:auto;margin-right:auto;
        }
        .biz-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .biz-btn-primary{
          background:#0f1f3d;color:#fff;
          padding:10px 22px;border-radius:8px;
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:700;font-size:.875rem;
        }
        .biz-btn-primary:hover{background:#1e3a5f}
        .biz-btn-secondary{
          background:transparent;color:#6b7280;
          padding:10px 22px;border-radius:8px;
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:600;font-size:.875rem;
          border:1px solid #d1cfc6;
        }
        .biz-btn-secondary:hover{border-color:#9ca3af;color:#374151}

        /* FOOTER */
        .footer{
          background:#0f1f3d;border-top:1px solid rgba(255,255,255,.07);
          padding:20px 28px;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:12px;
        }
        .footer-logo{font-size:.9rem;font-weight:700;color:#fff}
        .footer-logo span{color:#4ade80}
        .footer-links{display:flex;gap:18px}
        .footer-link{font-size:.75rem;color:#475569;font-family:system-ui,sans-serif;text-decoration:none}
        .footer-link:hover{color:#94a3b8}
        .footer-copy{font-size:.72rem;color:#334155;font-family:system-ui,sans-serif}

        /* RESPONSIVE */
        @media(max-width:768px){
          .nav{padding:12px 16px}
          .hero{padding:40px 16px 36px}
          .how-inner{grid-template-columns:1fr;gap:24px;padding:36px 16px}
          .deals-section{padding:36px 16px}
          .cities-section{padding:36px 16px}
          .footer{padding:16px;flex-direction:column;text-align:center}
          .footer-links{justify-content:center}
          .nav-links .nav-link{display:none}
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">clean<span>list</span></span>
        </Link>
        <div className="nav-links">
          <Link href="/cannabis/illinois/open-now" className="nav-link">Open now</Link>
          <Link href="/cannabis/illinois" className="nav-link">Browse Illinois</Link>
          <Link href="/upgrade" className="nav-cta">For dispensaries</Link>
        </div>
      </nav>

      {/* HERO — decision engine entry point with botanical plants */}
      <div className="hero">
        <PlantSilhouette side="left" />
        <PlantSilhouette side="right" />
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Illinois dispensary deals — live
          </div>
          <h1>Best Bud For<br /><em>Your Buck$</em></h1>
          <p className="hero-sub">Low Prices. High Times.</p>

          {/* CATEGORY SELECTION */}
          <div className="category-grid">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/deals/${cat.slug}`}
                className={`cat-btn ${cat.slug === 'all' ? 'primary' : ''}`}
              >
                {renderIcon(cat.icon)}
                {cat.label}
              </Link>
            ))}
          </div>

          {/* QUICK FILTERS */}
          <div className="filter-row">
            {QUICK_FILTERS.map(f => (
              <Link
                key={f.param}
                href={`/deals/all?${f.param}`}
                className="filter-pill"
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="how">
        <div className="how-inner">
          <div className="how-step">
            <div className="how-num">01</div>
            <div className="how-title">Pick what you want</div>
            <div className="how-desc">
              Flower, edibles, vapes, or concentrates.
              We pull every active deal within range.
            </div>
          </div>
          <div className="how-step">
            <div className="how-num">02</div>
            <div className="how-title">We do the math</div>
            <div className="how-desc">
              Price per gram, discount percentage, distance,
              open status — normalized so you don&apos;t have to.
            </div>
          </div>
          <div className="how-step">
            <div className="how-num">03</div>
            <div className="how-title">You save money</div>
            <div className="how-desc">
              One recommendation. Where to go right now
              for the best value. You see exactly how much you save.
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S DEALS */}
      <div className="deals-section">
        <p className="section-eyebrow">Live deals</p>
        <h2 className="section-title">Best deals in Illinois today</h2>
        <p className="section-sub">Updated continuously · Verified against dispensary sites</p>

        <div className="deal-cards">
          <div className="deal-card top-pick">
            <div className="top-pick-badge">Best value today</div>
            <div className="deal-card-header">
              <div>
                <div className="deal-name">NOXX East Peoria</div>
                <div className="deal-city">East Peoria, IL</div>
              </div>
              <span className="open-badge open">Open</span>
            </div>
            <div className="deal-highlight">30% off all vapes</div>
            <div className="deal-reason">Cheapest vape deal within 15 miles · 4 min away</div>
            <div className="deal-attrs">
              <span className="deal-attr">Drive-thru</span>
              <span className="deal-attr">Cards OK</span>
              <span className="deal-attr">4.7 ★</span>
            </div>
            <div className="deal-savings">
              <span className="savings-label">You save vs avg price</span>
              <span className="savings-num">~$18</span>
            </div>
          </div>

          <div className="deal-card">
            <div className="deal-card-header">
              <div>
                <div className="deal-name">Ivy Hall Peoria</div>
                <div className="deal-city">Peoria, IL</div>
              </div>
              <span className="open-badge open">Open</span>
            </div>
            <div className="deal-highlight">$5 pre-rolls Mon–Wed</div>
            <div className="deal-reason">Weekly recurring deal · 9 min away</div>
            <div className="deal-attrs">
              <span className="deal-attr">Cards OK</span>
              <span className="deal-attr">4.5 ★</span>
            </div>
            <div className="deal-savings">
              <span className="savings-label">You save vs avg price</span>
              <span className="savings-num">~$12</span>
            </div>
          </div>

          <div className="deal-card">
            <div className="deal-card-header">
              <div>
                <div className="deal-name">Terrace Cannabis</div>
                <div className="deal-city">Moline, IL</div>
              </div>
              <span className="open-badge open">Open</span>
            </div>
            <div className="deal-highlight">20% off all flower today</div>
            <div className="deal-reason">Highest rated in IL · 4.9 ★ · 4,200+ reviews</div>
            <div className="deal-attrs">
              <span className="deal-attr">Drive-thru</span>
              <span className="deal-attr">4.9 ★</span>
            </div>
            <div className="deal-savings">
              <span className="savings-label">You save vs avg price</span>
              <span className="savings-num">~$10</span>
            </div>
          </div>
        </div>
      </div>

      {/* CITY BROWSE */}
      <div className="cities-section">
        <div className="cities-inner">
          <div className="cities-title">Browse by city</div>
          <div className="cities-sub">Find deals near you across Illinois</div>
          <div className="city-grid">
            {CITIES.map(city => (
              <Link
                key={city.slug}
                href={`/cannabis/illinois/${city.slug}`}
                className="city-card"
              >
                <div className="city-name">{city.name}</div>
                <div className="city-pills">
                  <Link href={`/cannabis/illinois/${city.slug}/deals`} className="city-pill">Deals</Link>
                  <Link href={`/cannabis/illinois/${city.slug}/open-now`} className="city-pill">Open now</Link>
                  <Link href={`/cannabis/illinois/${city.slug}/best`} className="city-pill">Best</Link>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* DISPENSARY CTA */}
      <div className="biz-strip">
        <div className="biz-title">Own a dispensary?</div>
        <p className="biz-sub">
          Get your daily deals in front of people actively looking to buy right now.
          Featured placement from $49/month.
        </p>
        <div className="biz-btns">
          <Link href="/upgrade" className="biz-btn-primary">Submit your deals →</Link>
          <Link href="/get-listed" className="biz-btn-secondary">Claim free listing</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span className="footer-logo">clean<span>list</span></span>
        <div className="footer-links">
          <Link href="/cannabis/illinois" className="footer-link">Illinois</Link>
          <Link href="/cannabis/illinois/first-time-guide" className="footer-link">First-time guide</Link>
          <Link href="/cannabis/illinois/laws" className="footer-link">IL laws</Link>
          <Link href="/upgrade" className="footer-link">For dispensaries</Link>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} CleanList</span>
      </footer>
    </>
  );
}
