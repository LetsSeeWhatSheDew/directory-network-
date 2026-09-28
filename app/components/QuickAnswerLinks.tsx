// Link rows into the city answer pages (lib/answers.ts ANSWER_TOPICS).
// <QuickAnswerLinks city> — one small row on a city page.
// <QuickAnswersByCity> — every question × every city, for /guides.
import Link from "next/link";
import { ANSWER_TOPICS } from "../../lib/answers";
import { CENTRAL_IL_CITIES } from "../../lib/constants/regions";

const CSS = `
.qal{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:10px 0 4px;font-size:.82rem}
.qal-l{font-family:var(--font-mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--pp-muted)}
.qal a{padding:4px 10px;border-radius:999px;border:1px solid var(--pp-border);background:var(--pp-surface);color:inherit;text-decoration:none;white-space:nowrap}
.qal a:hover{border-color:var(--pp-canopy)}
.qab{display:flex;flex-direction:column;gap:14px}
.qab b{display:block;font-weight:600;margin-bottom:6px}
`;

export default function QuickAnswerLinks({ city, cityName }: { city: string; cityName: string }) {
  return (
    <nav className="qal" aria-label={`Quick answers for ${cityName}`}>
      <style>{CSS}</style>
      <span className="qal-l">Quick answers</span>
      {ANSWER_TOPICS.map((t) => (
        <Link key={t.topic} href={t.path(city)}>{t.short}</Link>
      ))}
    </nav>
  );
}

export function QuickAnswersByCity() {
  return (
    <div className="qab">
      <style>{CSS}</style>
      {ANSWER_TOPICS.map((t) => (
        <div key={t.topic}>
          <b>{t.question("your city")}</b>
          <nav className="qal" style={{ margin: 0 }} aria-label={t.short}>
            {CENTRAL_IL_CITIES.map((c) => (
              <Link key={c.slug} href={t.path(c.slug)}>{c.name}</Link>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}
