# Chrome Resume — 8:30pm April 15

Two tasks. Under 10 minutes.

## TASK 1 — Add TXT record to Namecheap (fixes "Not Secure" on puffprice.com)

1. namecheap.com → Domain List → puffprice.com → Manage → Advanced DNS
2. Add New Record:
   - Type: TXT Record
   - Host: _vercel
   - Value: vc-domain-verify=puffprice.com,7bbbf16fdf9faeb9a327
   - TTL: Automatic
3. Save
4. vercel.com → directory-network- → Settings → Domains → Verify puffprice.com
5. Confirm green status. SSL auto-provisions within 10 min.

## TASK 2 — Add GA4 to cleanlist.co Vercel project

1. vercel.com → directory-network (cleanlist.co) → Settings → Environment Variables
2. Add: NEXT_PUBLIC_GA_MEASUREMENT_ID = G-TML9Y6VMC2
3. Redeploy cleanlist.co

## After both tasks — still needs Matthew (requires his logins):
- Stripe: STRIPE_SECRET_KEY + STRIPE_PRO_PRICE_ID → Vercel directory-network-
- Resend: RESEND_API_KEY → Vercel directory-network-
