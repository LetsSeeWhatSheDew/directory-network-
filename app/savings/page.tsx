import Link from "next/link";
import Logo from "../components/Logo";
import SavingsCalculator from "./SavingsCalculator";

export const metadata = {
  title: "How much are you leaving on the table? | PuffPrice",
  description:
    "Quick calculator: see how much Illinois cannabis shoppers with your habits are overpaying — and how much PuffPrice users save.",
};

export default function SavingsPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;position:sticky;top:0;z-index:100}
        .logo{color:#fff;text-decoration:none;font-weight:700;letter-spacing:-.02em}
        .logo span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:620px;margin:0 auto;padding:48px 20px 60px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:12px}
        h1{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:700;letter-spacing:-.04em;line-height:1.1;margin-bottom:10px}
        .sub{font-size:1rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.6;margin-bottom:28px;max-width:520px}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home"><Logo /></Link>
        <Link href="/" className="back">← Home</Link>
      </nav>

      <main className="wrap">
        <div className="eyebrow">Savings calculator</div>
        <h1>How much are you leaving on the table?</h1>
        <p className="sub">
          Three quick questions. We&apos;ll estimate how much cannabis shoppers with
          your habits overpay each year — and what PuffPrice users with the same
          profile save.
        </p>
        <SavingsCalculator />
      </main>
    </>
  );
}
