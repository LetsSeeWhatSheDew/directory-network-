// Best Bud — header + footer shared by the four screens.
import Link from "next/link";
import { BUD_CSS } from "./css";

export function BudShell({ children, where = "Central IL" }: { children: React.ReactNode; where?: string }) {
  return (
    <main className="brx bud">
      <style dangerouslySetInnerHTML={{ __html: BUD_CSS }} />
      <header className="bud-top">
        <div>
          <Link href="/preview/brand-reset/best-bud" className="bud-word" aria-label="PuffPrice home">
            Puff<i>Price</i>
          </Link>
          <p className="bud-line">
            Best Bud For Your Buck<b>$</b>
          </p>
        </div>
        <Link href="/preview/brand-reset" className="bud-where">
          {where} ▾
        </Link>
      </header>
      {children}
      <p className="bud-foot">
        <b>Nobody pays us to rank.</b> We read each store&apos;s own website every morning. 21+.
      </p>
    </main>
  );
}
