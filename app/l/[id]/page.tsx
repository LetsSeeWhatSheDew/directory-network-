export const revalidate = 0;

import Link from "next/link";
import ClaimForm from "../../components/ClaimForm";

type Listing = {
  id: string;
  project_tag: string;
  type: string | null;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  address1: string | null;
  phone: string | null;
  website: string | null;
  short_description: string | null;
  long_description: string | null;
  plan: string | null;
  claimed: boolean | null;
  logo_url: string | null;
  hero_image_url: string | null;
  delivery: boolean | null;
  drive_thru: boolean | null;
  online_ordering: boolean | null;
  accepts_credit: boolean | null;
  cash_only: boolean | null;
  atm_onsite: boolean | null;
  wheelchair_accessible: boolean | null;
  parking: boolean | null;
  loyalty_program: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
};

type ListingHour = {
  id?: number;
  project_tag: string;
  listing_id: string;
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean | null;
};

type ListingAttribute = {
  id?: number;
  project_tag: string;
  listing_id: string;
  tag: string;
};

type ProductOrService = {
  id?: number;
  project_tag: string;
  listing_id: string;
  category: string;
  subcategory: string;
  available: boolean | null;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const REST_BASE = `${SUPABASE_URL}/rest/v1`;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${REST_BASE}${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to fetch: ${JSON.stringify(err)}`);
  }
  return res.json();
}

async function getListing(id: string): Promise<Listing | null> {
  const rows = await fetchJson<Listing[]>(
    `/master_listings?slug=eq.${encodeURIComponent(id)}&select=*`
  );
  return rows?.[0] ?? null;
}

async function getHours(listingId: string): Promise<ListingHour[]> {
  return fetchJson<ListingHour[]>(
    `/listing_hours?listing_id=eq.${encodeURIComponent(listingId)}&select=*&order=weekday.asc`
  );
}

async function getAttributes(listingId: string): Promise<ListingAttribute[]> {
  return fetchJson<ListingAttribute[]>(
    `/listing_attributes?listing_id=eq.${encodeURIComponent(listingId)}&select=*&order=tag.asc`
  );
}

async function getProducts(listingId: string): Promise<ProductOrService[]> {
  return fetchJson<ProductOrService[]>(
    `/products_or_services?listing_id=eq.${encodeURIComponent(listingId)}&select=*&order=category.asc,subcategory.asc`
  );
}

function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getTodayStatus(hours: ListingHour[]): { open: boolean; label: string } {
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7; // convert Sun=0 to Mon=0
  const row = hours.find((h) => h.weekday === dayIdx);
  if (!row || row.is_closed || !row.opens_at || !row.closes_at) {
    return { open: false, label: "Closed today" };
  }
  const [oh, om] = row.opens_at.split(":").map(Number);
  const [ch, cm] = row.closes_at.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  if (nowMins >= openMins && nowMins < closeMins) {
    return { open: true, label: `Open until ${formatTime(row.closes_at)}` };
  }
  if (nowMins < openMins) {
    return { open: false, label: `Opens at ${formatTime(row.opens_at)}` };
  }
  return { open: false, label: "Closed now" };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return (
      <div style={styles.notFound}>
        <div style={styles.notFoundCard}>
          <p style={styles.notFoundTitle}>Listing not found</p>
          <p style={styles.notFoundSub}>We couldn&apos;t find <code style={styles.code}>{id}</code></p>
          <Link href="/" style={styles.notFoundLink}>← Back to directories</Link>
        </div>
      </div>
    );
  }

  const [hours, attributes, products] = await Promise.all([
    getHours(listing.id),
    getAttributes(listing.id),
    getProducts(listing.id),
  ]);

  const todayStatus = getTodayStatus(hours);
  const isClaimed = listing.claimed === true;

  // Group products by category
  const productsByCategory = products.reduce<Record<string, ProductOrService[]>>((acc, p) => {
    const cat = p.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div style={styles.root}>
      {/* ── NAV ── */}
      <nav style={styles.nav}>
        <Link href="/" style={styles.navBrand}>
          <span style={styles.navDot} />
          <span style={styles.navName}>Directory<span style={styles.navAccent}>Network</span></span>
        </Link>
        <Link href="/" style={styles.navBack}>← All Directories</Link>
      </nav>

      {/* ── UNCLAIMED BANNER ── */}
      {!isClaimed && (
        <div style={styles.unclaimedBanner}>
          <span style={styles.unclaimedDot} />
          <span style={styles.unclaimedText}>
            This listing hasn&apos;t been claimed yet.{" "}
            <a href="#claim" style={styles.unclaimedLink}>Is this your business? Claim it free →</a>
          </span>
        </div>
      )}

      <div style={styles.pageInner}>

        {/* ── HERO CARD ── */}
        <div style={styles.heroCard}>
          <div style={styles.heroTop}>
            {/* Logo or initial */}
            <div style={styles.logoArea}>
              {listing.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={listing.logo_url}
                  alt={`${listing.name} logo`}
                  style={styles.logoImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div style={styles.logoFallback}>
                  {(listing.name ?? "?").charAt(0)}
                </div>
              )}
            </div>

            {/* Business info */}
            <div style={styles.heroInfo}>
              <div style={styles.heroMeta}>
                <span style={styles.heroCategoryBadge}>
                  {listing.type ?? "Dispensary"}
                </span>
                {listing.plan && listing.plan !== "free" && (
                  <span style={styles.heroPlanBadge}>{listing.plan}</span>
                )}
              </div>
              <h1 style={styles.heroName}>{listing.name ?? "Unnamed Listing"}</h1>
              <p style={styles.heroLocation}>
                {[listing.address1, listing.city, listing.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {listing.short_description && (
                <p style={styles.heroTagline}>{listing.short_description}</p>
              )}
            </div>

            {/* Status + contact */}
            <div style={styles.heroActions}>
              <div style={{
                ...styles.statusBadge,
                background: todayStatus.open ? "#dcfce7" : "#fee2e2",
                color: todayStatus.open ? "#14532d" : "#991b1b",
              }}>
                <span style={{
                  ...styles.statusDot,
                  background: todayStatus.open ? "#16a34a" : "#dc2626",
                }} />
                {todayStatus.label}
              </div>
              {listing.phone && (
                <a href={`tel:${listing.phone}`} style={styles.phoneLink}>
                  {listing.phone}
                </a>
              )}
              {listing.website && (
                <a
                  href={listing.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.websiteLink}
                >
                  Visit website →
                </a>
              )}
            </div>
          </div>

          {/* Quick amenities strip */}
          <div style={styles.amenitiesStrip}>
            {listing.delivery === true && <span style={styles.amenityBadge}>🚗 Delivery</span>}
            {listing.online_ordering === true && <span style={styles.amenityBadge}>📱 Online ordering</span>}
            {listing.drive_thru === true && <span style={styles.amenityBadge}>🏎 Drive-thru</span>}
            {listing.atm_onsite === true && <span style={styles.amenityBadge}>💵 ATM on-site</span>}
            {listing.wheelchair_accessible === true && <span style={styles.amenityBadge}>♿ Accessible</span>}
            {listing.parking === true && <span style={styles.amenityBadge}>🅿 Parking</span>}
            {listing.loyalty_program === true && <span style={styles.amenityBadge}>⭐ Loyalty program</span>}
            {listing.accepts_credit === true && <span style={styles.amenityBadge}>💳 Credit cards</span>}
            {listing.cash_only === true && <span style={styles.amenityBadge}>💵 Cash only</span>}
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div style={styles.contentGrid}>

          {/* LEFT COLUMN */}
          <div style={styles.leftCol}>

            {/* Hours */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Hours</h2>
              {hours.length === 0 ? (
                <p style={styles.emptyText}>Hours not available yet.</p>
              ) : (
                <div style={styles.hoursList}>
                  {DAYS.map((day, idx) => {
                    const row = hours.find((h) => h.weekday === idx);
                    const isToday = ((new Date().getDay() + 6) % 7) === idx;
                    const closed = !row || row.is_closed || (!row.opens_at && !row.closes_at);
                    return (
                      <div key={day} style={{
                        ...styles.hoursRow,
                        background: isToday ? "#f0fdf4" : "transparent",
                        borderRadius: isToday ? "8px" : "0",
                        padding: isToday ? "6px 10px" : "4px 0",
                        margin: isToday ? "0 -10px" : "0",
                      }}>
                        <span style={{
                          ...styles.hoursDay,
                          fontWeight: isToday ? 700 : 500,
                          color: isToday ? "#14532d" : "#374151",
                        }}>
                          {day}{isToday && <span style={styles.todayDot} />}
                        </span>
                        <span style={{
                          ...styles.hoursTime,
                          color: closed ? "#9ca3af" : (isToday ? "#14532d" : "#374151"),
                        }}>
                          {closed
                            ? "Closed"
                            : `${formatTime(row?.opens_at ?? null)} – ${formatTime(row?.closes_at ?? null)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attributes */}
            {attributes.length > 0 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Features</h2>
                <div style={styles.tagCloud}>
                  {attributes.map((a) => (
                    <span key={`${a.listing_id}-${a.tag}`} style={styles.featureTag}>
                      {a.tag.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {products.length > 0 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Products & Services</h2>
                <div style={styles.productGrid}>
                  {Object.entries(productsByCategory).map(([cat, items]) => (
                    <div key={cat} style={styles.productCategory}>
                      <p style={styles.productCatLabel}>{cat}</p>
                      <div style={styles.productItems}>
                        {items.map((p) => (
                          <span key={`${p.listing_id}-${p.category}-${p.subcategory}`}
                            style={{
                              ...styles.productItem,
                              opacity: p.available === false ? 0.4 : 1,
                            }}>
                            {p.subcategory}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={styles.rightCol}>

            {/* About */}
            {listing.long_description && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>About</h2>
                <p style={styles.aboutText}>{listing.long_description}</p>
              </div>
            )}

            {/* Claim CTA */}
            <div id="claim" style={styles.claimCard}>
              {isClaimed ? (
                <div style={styles.claimedBadge}>
                  <span style={styles.claimedIcon}>✓</span>
                  <div>
                    <p style={styles.claimedTitle}>Verified listing</p>
                    <p style={styles.claimedSub}>This business has claimed and verified their listing.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.claimHeader}>
                    <div style={styles.claimIconWrap}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2L12.4 7.2L18 8L14 12L15.2 18L10 15.2L4.8 18L6 12L2 8L7.6 7.2L10 2Z" fill="#16a34a" />
                      </svg>
                    </div>
                    <div>
                      <h3 style={styles.claimTitle}>Claim this listing</h3>
                      <p style={styles.claimSub}>Free to claim. No credit card required.</p>
                    </div>
                  </div>
                  <p style={styles.claimBody}>
                    Own or manage <strong>{listing.name}</strong>? Claim your listing to update
                    hours, add photos, respond to customers, and unlock premium features.
                  </p>
                  <ClaimForm
                    listingId={listing.id}
                    projectTag={listing.project_tag}
                    listingTitle={listing.name ?? "this listing"}
                  />
                  <div style={styles.claimTrustRow}>
                    <span style={styles.claimTrustItem}>🔒 Secure</span>
                    <span style={styles.claimTrustItem}>✓ Free forever</span>
                    <span style={styles.claimTrustItem}>⚡ Live in 72hrs</span>
                  </div>
                </>
              )}
            </div>

            {/* Directory trust card */}
            <div style={styles.trustCard}>
              <p style={styles.trustTitle}>Why Directory Network?</p>
              <ul style={styles.trustList}>
                <li style={styles.trustItem}>✓ Verified Illinois cannabis listings</li>
                <li style={styles.trustItem}>✓ Real hours updated by owners</li>
                <li style={styles.trustItem}>✓ No spam, no fake reviews</li>
                <li style={styles.trustItem}>✓ Free base listing always</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── FOOTER NAV ── */}
        <div style={styles.footerNav}>
          <Link href="/" style={styles.footerBack}>← Back to all directories</Link>
          <Link href="/cannabis/illinois" style={styles.footerForward}>Browse Illinois dispensaries →</Link>
        </div>
      </div>

      {/* ── PAGE FOOTER ── */}
      <footer style={styles.footer}>
        <span style={styles.footerBrand}>
          Directory<span style={styles.footerAccent}>Network</span>
        </span>
        <span style={styles.footerNote}>
          © {new Date().getFullYear()} Directory Network · Illinois Cannabis Directory
        </span>
      </footer>
    </div>
  );
}

/* ─────────────────────── STYLES ─────────────────────── */
const styles: Record<string, any> = {
  root: {
    minHeight: "100vh",
    background: "#f7f6f2",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#1a1a1a",
  },

  /* NAV */
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "#ffffff",
    borderBottom: "1px solid #e8e5de",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
  },
  navDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#16a34a",
    display: "inline-block",
  },
  navName: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0f1f3d",
    letterSpacing: "-0.02em",
  },
  navAccent: { color: "#16a34a" },
  navBack: {
    fontSize: "0.85rem",
    color: "#6b7280",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    transition: "color 0.15s",
  },

  /* UNCLAIMED BANNER */
  unclaimedBanner: {
    background: "#fffbeb",
    borderBottom: "1px solid #fde68a",
    padding: "10px 32px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  unclaimedDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#d97706",
    flexShrink: 0,
  },
  unclaimedText: {
    fontSize: "0.85rem",
    color: "#92400e",
    fontFamily: "system-ui, sans-serif",
  },
  unclaimedLink: {
    color: "#d97706",
    fontWeight: 600,
    textDecoration: "none",
  },

  /* PAGE */
  pageInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 24px 64px",
  },

  /* HERO CARD */
  heroCard: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e8e5de",
    padding: "32px",
    marginBottom: "24px",
  },
  heroTop: {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  logoArea: {
    flexShrink: 0,
    width: "80px",
    height: "80px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e8e5de",
    background: "#f7f6f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "8px",
  },
  logoFallback: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#16a34a",
    fontFamily: "Georgia, serif",
  },
  heroInfo: {
    flex: 1,
    minWidth: "200px",
  },
  heroMeta: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  heroCategoryBadge: {
    fontSize: "0.7rem",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#16a34a",
    background: "#dcfce7",
    padding: "3px 10px",
    borderRadius: "100px",
  },
  heroPlanBadge: {
    fontSize: "0.7rem",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#6d28d9",
    background: "#ede9fe",
    padding: "3px 10px",
    borderRadius: "100px",
  },
  heroName: {
    fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "#0f1f3d",
    marginBottom: "6px",
    lineHeight: 1.1,
  },
  heroLocation: {
    fontSize: "0.9rem",
    color: "#6b7280",
    fontFamily: "system-ui, sans-serif",
    marginBottom: "8px",
  },
  heroTagline: {
    fontSize: "0.95rem",
    color: "#374151",
    fontFamily: "system-ui, sans-serif",
    lineHeight: 1.6,
    maxWidth: "480px",
  },
  heroActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "flex-start",
    minWidth: "180px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "100px",
    fontSize: "0.8rem",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  phoneLink: {
    fontSize: "0.9rem",
    color: "#0f1f3d",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  websiteLink: {
    fontSize: "0.85rem",
    color: "#16a34a",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
  },
  amenitiesStrip: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #f0ede6",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  amenityBadge: {
    fontSize: "0.78rem",
    fontFamily: "system-ui, sans-serif",
    color: "#374151",
    background: "#f7f6f2",
    border: "1px solid #e8e5de",
    padding: "4px 12px",
    borderRadius: "100px",
  },

  /* CONTENT GRID */
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "20px",
    alignItems: "start",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  /* CARD */
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e8e5de",
    padding: "24px",
  },
  cardTitle: {
    fontSize: "0.75rem",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#9ca3af",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    fontFamily: "system-ui, sans-serif",
  },

  /* HOURS */
  hoursList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  hoursRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursDay: {
    fontSize: "0.875rem",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  todayDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#16a34a",
  },
  hoursTime: {
    fontSize: "0.875rem",
    fontFamily: "system-ui, sans-serif",
  },

  /* ATTRIBUTES */
  tagCloud: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  featureTag: {
    fontSize: "0.8rem",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 500,
    color: "#0f1f3d",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "5px 14px",
    borderRadius: "100px",
    textTransform: "capitalize",
  },

  /* PRODUCTS */
  productGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  productCategory: {},
  productCatLabel: {
    fontSize: "0.75rem",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: "8px",
  },
  productItems: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  productItem: {
    fontSize: "0.8rem",
    fontFamily: "system-ui, sans-serif",
    color: "#374151",
    background: "#f7f6f2",
    border: "1px solid #e8e5de",
    padding: "4px 12px",
    borderRadius: "6px",
  },

  /* ABOUT */
  aboutText: {
    fontSize: "0.925rem",
    lineHeight: 1.75,
    color: "#374151",
    fontFamily: "system-ui, sans-serif",
  },

  /* CLAIM CARD */
  claimCard: {
    background: "#0f1f3d",
    borderRadius: "16px",
    padding: "28px",
    border: "1px solid #1e3a5f",
  },
  claimHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  claimIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  claimTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "2px",
    letterSpacing: "-0.01em",
  },
  claimSub: {
    fontSize: "0.78rem",
    color: "#a3e635",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
  },
  claimBody: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    fontFamily: "system-ui, sans-serif",
    lineHeight: 1.65,
    marginBottom: "20px",
  },
  claimTrustRow: {
    display: "flex",
    gap: "16px",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #1e3a5f",
    flexWrap: "wrap",
  },
  claimTrustItem: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontFamily: "system-ui, sans-serif",
  },
  claimedBadge: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  claimedIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
    flexShrink: 0,
  },
  claimedTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "4px",
  },
  claimedSub: {
    fontSize: "0.825rem",
    color: "#94a3b8",
    fontFamily: "system-ui, sans-serif",
    lineHeight: 1.5,
  },

  /* TRUST CARD */
  trustCard: {
    background: "#f0fdf4",
    borderRadius: "16px",
    padding: "20px 24px",
    border: "1px solid #bbf7d0",
  },
  trustTitle: {
    fontSize: "0.8rem",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#14532d",
    marginBottom: "12px",
  },
  trustList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  trustItem: {
    fontSize: "0.825rem",
    color: "#166534",
    fontFamily: "system-ui, sans-serif",
    lineHeight: 1.4,
  },

  /* FOOTER NAV */
  footerNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "40px",
    paddingTop: "24px",
    borderTop: "1px solid #e8e5de",
    flexWrap: "wrap",
    gap: "12px",
  },
  footerBack: {
    fontSize: "0.85rem",
    color: "#6b7280",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
  },
  footerForward: {
    fontSize: "0.85rem",
    color: "#16a34a",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
  },

  /* NOT FOUND */
  notFound: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7f6f2",
    padding: "24px",
  },
  notFoundCard: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e8e5de",
    padding: "48px",
    textAlign: "center",
    maxWidth: "400px",
  },
  notFoundTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#0f1f3d",
    marginBottom: "8px",
  },
  notFoundSub: {
    fontSize: "0.875rem",
    color: "#6b7280",
    fontFamily: "system-ui, sans-serif",
    marginBottom: "24px",
  },
  notFoundLink: {
    color: "#16a34a",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  code: {
    fontFamily: "monospace",
    background: "#f3f4f6",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.85em",
  },

  /* FOOTER */
  footer: {
    background: "#0f1f3d",
    padding: "24px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  footerBrand: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  footerAccent: { color: "#16a34a" },
  footerNote: {
    fontSize: "0.78rem",
    color: "#475569",
    fontFamily: "system-ui, sans-serif",
  },
};
