import Nav from "../components/Nav";
import HazeBand from "../components/HazeBand";
import Footer from "../components/Footer";

const OG_DESC =
  "Cannabis deal finder for Central Illinois, checked on the stores' own sites every morning. Independent: nobody pays us to rank.";
const OG_IMAGE = "https://www.puffprice.com/og-image.png";

export const metadata = {
  title: "About PuffPrice — Built in Peoria, Illinois",
  description: OG_DESC,
  openGraph: {
    title: "About PuffPrice — Built in Peoria, Illinois",
    description: OG_DESC,
    url: "https://www.puffprice.com/about",
    siteName: "PuffPrice",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "About PuffPrice",
    description: OG_DESC,
    images: [OG_IMAGE],
  },
};

export default function AboutPage() {
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-ui, system-ui, sans-serif);background:var(--pp-paper);color:var(--pp-ink);min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:var(--pp-surface);border-bottom:1px solid var(--pp-border);position:sticky;top:0;z-index:100}
        .logo-link{display:flex;align-items:center;gap:10px;text-decoration:none}
        .back{font-size:.82rem;color:var(--pp-muted);text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif)}
        .back:hover{color:var(--pp-ink)}
        .about-photo{
          position:relative;
          width:100%;
          height:clamp(220px, 30vw, 380px);
          overflow:hidden;
        }
        .about-photo img{object-fit:cover;object-position:center 30%}
        .about-photo-tint{
          position:absolute;inset:0;
          background:
            linear-gradient(to bottom,
              rgba(245,244,240,0) 60%,
              rgba(245,244,240,0.95) 100%),
            linear-gradient(rgba(15,31,61,0.06), rgba(15,31,61,0.06));
          pointer-events:none;
        }
        .about-photo-credit{
          position:absolute;bottom:8px;right:12px;
          font-size:.7rem;color:rgba(255,255,255,0.85);
          font-family:var(--font-ui, system-ui, sans-serif);
          text-shadow:0 1px 2px rgba(0,0,0,0.4);
        }
        .wrap{max-width:680px;margin:0 auto;padding:48px 28px 64px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-signal);font-family:var(--font-ui, system-ui, sans-serif);margin-bottom:14px}
        h1{
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(2rem,4.5vw,3rem);font-weight:700;
          letter-spacing:-.04em;line-height:1.1;margin-bottom:32px;color:var(--pp-ink)
        }
        p{
          font-family:var(--font-display), system-ui, sans-serif;
          font-size:1.0625rem;line-height:1.7;margin-bottom:22px;color:var(--pp-body)
        }
        p:last-of-type{margin-bottom:32px}
        .contact{
          margin-top:48px;padding-top:24px;border-top:1px solid var(--pp-border);
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;color:var(--pp-muted)
        }
        .contact a{color:var(--pp-signal);text-decoration:none;font-weight:600}
        .contact a:hover{text-decoration:underline}
        .built{
          margin-top:48px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.85rem;color:var(--pp-muted);text-align:center
        }
        @media(max-width:600px){.wrap{padding:48px 20px 40px}.nav{padding:12px 16px}}
      `}</style>

      <Nav variant="light" />

      <HazeBand height={180} />

      <main className="wrap">
        <div className="eyebrow">About</div>
        <h1>We built the thing we wished existed.</h1>

        <p>
          PuffPrice tells you where to find the best cannabis deal near you
          in Central Illinois. That&apos;s the whole job.
        </p>

        <p>
          It exists because every existing tool fails the same way. Weedmaps
          and Leafly have national coverage but the deals are stale, the
          prices are unverified, and half the listings are paid placement
          dressed up as ranking. The free tools work fine until you ask them
          what&apos;s actually 20% off in Peoria today, at which point they
          go quiet.
        </p>

        <p>
          So we built a smaller thing that does one thing better. Direct from
          the dispensary&apos;s own website. Verified daily. Honest about
          what we know and what we don&apos;t. No paid placement, no menu
          reselling, no national-aggregator inventory passed off as real
          coverage.
        </p>

        <p>
          We start in Central Illinois — twelve cities across Peoria,
          Bloomington-Normal, Champaign-Urbana, Springfield, and the
          small-city belt between them. Real coverage in twelve cities
          beats fake coverage in a hundred. When we have a city locked,
          we&apos;ll add the next one. Not before.
        </p>

        <p>
          The model is plain. Listings are free for dispensaries — forever.
          The plan is to fund PuffPrice through Pro subscriptions ($0.99 a
          month, when we ship them) for instant email alerts and a daily digest. No
          ads. No sponsored placements. No selling your data. If the model
          breaks, we&apos;ll tell you and figure something else out.
        </p>

        <p>
          If you&apos;ve got a tip, a deal we missed, or a dispensary that
          should be listed, write to us. A real person reads every one.
        </p>

        <div className="contact">
          Tips, fixes, or a deal we missed?{" "}
          <a href="mailto:hi@puffprice.com">hi@puffprice.com</a>
        </div>

      </main>
      <Footer />
    </>
  );
}
