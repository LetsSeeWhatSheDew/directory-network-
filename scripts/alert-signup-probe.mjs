// scripts/alert-signup-probe.mjs — end-to-end check of the free alert signup on
// Re-run marker: 2026-11-19 second run after the error-code deploy.
// production, using PuffPrice's OWN address (hi@puffprice.com), never a
// shopper's. A pass means: the row saved (pending, double opt-in) AND Resend
// accepted the confirm email (the route answers 502/503 if the send fails).
// The confirm email then travels through hi@'s forwarding, so where it lands
// also shows where hi@puffprice.com forwards.
const r = await fetch("https://www.puffprice.com/api/alerts/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://www.puffprice.com" },
  body: JSON.stringify({ email: "hi@puffprice.com", city: "peoria", categories: ["all"] }),
  signal: AbortSignal.timeout(30000),
});
const text = await r.text();
console.log(`signup → HTTP ${r.status} ${text.slice(0, 300)}`);
if (!r.ok) process.exit(1);
