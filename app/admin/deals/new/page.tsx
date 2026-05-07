import type { Metadata } from "next";
import Link from "next/link";
import NewDealForm from "./NewDealForm";

export const metadata: Metadata = {
  title: "New deal · Admin | PuffPrice",
  robots: "noindex, nofollow",
};

export default function NewDealPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 20px 64px",
        fontFamily: "system-ui, sans-serif",
        color: "#1F3D2B",
        background: "#F7F4ED",
        minHeight: "100vh",
      }}
    >
      <Link
        href="/admin"
        style={{
          fontSize: ".82rem",
          color: "#6b7280",
          textDecoration: "none",
        }}
      >
        ← Admin
      </Link>
      <h1
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "1.8rem",
          fontWeight: 700,
          letterSpacing: "-.02em",
          margin: "8px 0 6px",
        }}
      >
        New deal
      </h1>
      <p
        style={{
          color: "#6b7280",
          fontSize: ".92rem",
          lineHeight: 1.5,
          marginBottom: 22,
        }}
      >
        Manual entry for deals that aren't coming through the scraper or the
        public submission form. The day picker drives the new active-days
        visibility filter — leave it untouched for an always-active deal,
        or pick the specific weekdays it runs on.
      </p>
      <NewDealForm />
    </main>
  );
}
