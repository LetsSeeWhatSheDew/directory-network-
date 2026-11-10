// Brand-reset previews (Nov 10, 2026). Design review only — DO NOT MERGE.
// • noindex/nofollow on every route here, and not in sitemap.ts or llms.txt.
// • Gated: 404 on the production deployment unless BRAND_RESET_PREVIEW=1, so
//   these pages can never show up on puffprice.com by accident. They render on
//   Vercel preview deploys and locally.
// • Styles are scoped to .brx (this folder). The site's Breathe tokens in
//   app/globals.css are untouched; the grain/haze/firefly layers the root
//   layout mounts are hidden only while a preview page is open.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Familjen_Grotesk, Zilla_Slab, Public_Sans } from "next/font/google";

const familjen = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--brx-bud", display: "swap" });
const zilla = Zilla_Slab({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--brx-scout-display", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--brx-scout-body", display: "swap" });

export const metadata: Metadata = {
  title: "Brand reset preview · not public",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const dynamic = "force-dynamic";

const RESET = `
html.brx-on body::after{display:none!important}
html.brx-on .pp-wash,html.brx-on .pp-fx,html.brx-on .pp-sticky-mobile-cta{display:none!important}
.brx{min-height:100dvh;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
.brx *{box-sizing:border-box}
.brx a{color:inherit}
.brx button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
@media (prefers-reduced-motion: reduce){.brx *,.brx *::before,.brx *::after{animation:none!important;transition:none!important}}
`;

export default function BrandResetLayout({ children }: { children: React.ReactNode }) {
  // Production build on the production deployment → 404. (NODE_ENV guard so a
  // pulled .env.local with VERCEL_ENV=production doesn't hide them in `next dev`.)
  const isProdSite = process.env.VERCEL_ENV === "production" && process.env.NODE_ENV === "production";
  if (isProdSite && process.env.BRAND_RESET_PREVIEW !== "1") notFound();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: RESET }} />
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('brx-on');try{sessionStorage.setItem('cl_picker_seen','1')}catch(e){}`,
        }}
      />
      <div className={`${familjen.variable} ${zilla.variable} ${publicSans.variable}`}>{children}</div>
    </>
  );
}
