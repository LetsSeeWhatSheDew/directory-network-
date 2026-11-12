// Retired 2026-11-11: the Gold Leaf header renders once in app/layout.tsx.
// Pages still call <Nav />; it renders nothing so nothing doubles up.
export default function Nav(_props: { variant?: "light" | "deep"; sticky?: boolean }) {
  return null;
}
