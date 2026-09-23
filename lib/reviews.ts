// lib/reviews.ts
// Read side for dispensary reviews (public.listing_reviews, moderated).
// Only APPROVED reviews are readable by anon (RLS). Every function fails
// soft: if the table doesn't exist yet, callers get [] / null and render
// nothing. No seeded or invented reviews, ever.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

export type Review = {
  id: string;
  rating: number;
  body: string | null;
  display_name: string | null;
  visit_month: string | null;
  created_at: string;
};

export type ReviewStats = { review_count: number; avg_rating: number };

export async function getApprovedReviews(slug: string, limit = 20): Promise<Review[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_reviews?select=id,rating,body,display_name,visit_month,created_at&project_tag=eq.green&status=eq.approved&listing_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc&limit=${limit}`,
      { headers: HEADERS, next: { revalidate: 300, tags: ["reviews"] } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getReviewStats(slug: string): Promise<ReviewStats | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_review_stats?select=review_count,avg_rating&listing_slug=eq.${encodeURIComponent(slug)}`,
      { headers: HEADERS, next: { revalidate: 300, tags: ["reviews"] } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row || !row.review_count) return null;
    return { review_count: Number(row.review_count), avg_rating: Number(row.avg_rating) };
  } catch {
    return null;
  }
}

/** Is the reviews table live? (Used to decide whether to show the form.) */
export async function reviewsEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/listing_reviews?select=id&limit=1`, {
      headers: HEADERS,
      next: { revalidate: 600, tags: ["reviews"] },
    });
    return res.ok;
  } catch {
    return false;
  }
}
