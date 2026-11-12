// The Scout — header + footer shared by the four screens.
import Link from "next/link";
import { SCOUT_CSS } from "./css";

export function ScoutShell({ children, storeCount, label = "Field report" }: { children: React.ReactNode; storeCount: number; label?: string }) {
  const day = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" });
  return (
    <main className="brx sc">
      <style dangerouslySetInnerHTML={{ __html: SCOUT_CSS }} />
      <header className="sc-top">
        <Link href="/preview/brand-reset/scout" className="sc-word" aria-label="PuffPrice home">
          PuffPrice
        </Link>
        <p className="sc-meta">
          <b>{label}</b>
          {day} · Central IL
        </p>
      </header>
      {children}
      <p className="sc-foot">
        <b>We check {storeCount} stores&apos; own sites every morning so you don&apos;t.</b> Nobody pays us to rank. 21+.
      </p>
    </main>
  );
}
