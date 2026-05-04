// app/get-listed/page.tsx
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { GetListedForm } from "../components/GetListedForm";

export const metadata = {
  title: "Get your dispensary listed | PuffPrice",
  description:
    "Free listing for every Central Illinois cannabis dispensary. Get discovered on city pages, search, and deal pages. Claim or add your dispensary in under 2 minutes.",
};

export default function GetListedPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--color-cream, #F7F4ED)", color: "var(--color-deep, #1F3D2B)" }}>
      <Nav variant="light" />

      <header style={{ padding: "clamp(2rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem) 0", maxWidth: 880, margin: "0 auto" }}>
        <p className="pp-eyebrow" style={{ marginBottom: 12 }}>For dispensaries</p>
        <h1 className="pp-h1" style={{ marginBottom: 14 }}>List your dispensary</h1>
        <p style={{ color: "var(--color-gray-600, #4B5563)", fontFamily: "Manrope, system-ui, sans-serif", fontSize: 17, lineHeight: 1.55, maxWidth: 640 }}>
          Free, forever. No featured tier, no paid placement. Submit the basics and we&apos;ll
          get the listing live on PuffPrice within 24 hours.
        </p>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 4vw, 2rem) clamp(3rem, 6vw, 5rem)" }}>
        <section className="pp-card-elevated" style={{ padding: "clamp(1.25rem, 3vw, 2rem)" }}>
          <GetListedForm />
        </section>
      </div>

      <Footer />
    </main>
  );
}
