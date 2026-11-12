// Retired 2026-11-11: the Gold Leaf footer renders once in app/layout.tsx.
// Pages still call <Footer />; it renders nothing so nothing doubles up.
export default function Footer(_props: Record<string, unknown> = {}) {
  return null;
}
