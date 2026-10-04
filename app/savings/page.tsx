import Nav from "../components/Nav";
import Footer from "../components/Footer";
import SavingsCalculator from "./SavingsCalculator";

import { brand } from "@/lib/brand";
export const metadata = {
  alternates: { canonical: `${brand.url}/savings` },
  title: "How much are you leaving on the table?",
  description:
    "Quick calculator: see how much Central Illinois cannabis shoppers with your habits are overpaying — and how much PuffPrice users save.",
};

export default function SavingsPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-body);color:var(--pp-body);min-height:100vh}
        .wrap{max-width:620px;margin:0 auto;padding:48px 20px 60px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-signal);font-family:var(--font-body);margin-bottom:12px}
        h1{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:700;letter-spacing:-.04em;line-height:1.1;margin-bottom:10px}
        .sub{font-size:1rem;color:var(--pp-body);font-family:var(--font-body);line-height:1.6;margin-bottom:28px;max-width:520px}
      `}</style>

      <Nav variant="light" />

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
      <Footer />
    </>
  );
}
