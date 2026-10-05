import type { Metadata } from "next";
import Link from "next/link";
import NewDealForm from "./NewDealForm";

export const metadata: Metadata = {
  title: "New deal · Admin",
  robots: "noindex, nofollow",
};

export default function NewDealPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 20px 64px",
        fontFamily: "var(--font-body)",
        color: "var(--pp-ink)",
        minHeight: "100vh",
      }}
    >
      <Link
        href="/admin"
        style={{
          fontSize: ".82rem",
          color: "var(--pp-muted)",
          textDecoration: "none",
        }}
      >
        ← Admin
      </Link>
      <h1
        style={{
          fontFamily: "var(--font-breath)",
          fontSize: "1.8rem",
          fontWeight: 400,
          letterSpacing: "-.02em",
          margin: "8px 0 6px",
        }}
      >
        New deal
      </h1>
      <p
        style={{
          color: "var(--pp-muted)",
          fontSize: ".92rem",
          lineHeight: 1.5,
          marginBottom: 22,
        }}
      >
        Manual entry for deals that aren&apos;t coming through the scraper or the
        public submission form. The day picker drives the new active-days
        visibility filter — leave it untouched for an always-active deal,
        or pick the specific weekdays it runs on.
      </p>
      <NewDealForm />
    </main>
  );
}
