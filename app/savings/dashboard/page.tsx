"use client";

import Link from "next/link";
import Logo from "../../components/Logo";
import { useEffect, useMemo, useState } from "react";

type Record = {
  dispensary: string;
  dealTitle: string;
  savingsAmount: number;
  category: string | null;
  clickedAt: number;
};

const STORAGE_KEY = "cl_savings_log";

export default function SavingsDashboard() {
  const [records, setRecords] = useState<Record[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const arr = raw ? JSON.parse(raw) : [];
      setRecords(Array.isArray(arr) ? arr : []);
    } catch {
      setRecords([]);
    }
  }, []);

  const { monthly, lifetime, count, month } = useMemo(() => {
    if (!records) return { monthly: 0, lifetime: 0, count: 0, month: "this month" };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let monthly = 0;
    let lifetime = 0;
    for (const r of records) {
      const s = Number(r.savingsAmount) || 0;
      lifetime += s;
      if (r.clickedAt >= startOfMonth) monthly += s;
    }
    return {
      monthly: Math.round(monthly),
      lifetime: Math.round(lifetime),
      count: records.length,
      month: now.toLocaleString("en-US", { month: "long" }),
    };
  }, [records]);

  async function share() {
    const text = `I've saved $${monthly} on cannabis this month with PuffPrice → https://www.puffprice.com/savings/dashboard`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: "https://www.puffprice.com/savings/dashboard" });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#F7F4ED;color:#1F3D2B;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#1F3D2B;position:sticky;top:0;z-index:100}
        .logo{color:#fff;text-decoration:none;font-weight:700}
        .logo span{color:#93CB5C}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .wrap{max-width:720px;margin:0 auto;padding:40px 20px 64px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7DBA47;font-family:system-ui,sans-serif;margin-bottom:10px}
        h1{font-size:clamp(1.8rem,4.5vw,2.4rem);font-weight:700;letter-spacing:-.03em;line-height:1.15;margin-bottom:22px}
        .stat-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:22px}
        @media(max-width:520px){.stat-row{grid-template-columns:1fr;gap:10px}}
        .stat{background:#fff;border:1px solid #e8e4da;border-radius:14px;padding:18px}
        .stat.primary{background:#1F3D2B;color:#fff;border-color:#1F3D2B}
        .stat-label{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:6px}
        .stat.primary .stat-label{color:#93CB5C}
        .stat-num{font-size:1.9rem;font-weight:700;letter-spacing:-.02em;line-height:1;font-family:Georgia,serif}
        .stat.primary .stat-num{color:#fff}
        .stat.primary .stat-num span{color:#93CB5C}
        .row-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
        .row-head h2{font-size:1.1rem;font-weight:700;letter-spacing:-.02em}
        .share{background:#7DBA47;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-family:system-ui,sans-serif;font-weight:700;font-size:.82rem;cursor:pointer}
        .share:hover{background:#6BA63B}
        .share.copied{background:#6BA63B}
        .list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
        .rec{background:#fff;border:1px solid #e8e4da;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;gap:10px}
        .rec-name{font-size:.92rem;font-weight:700;color:#1F3D2B}
        .rec-title{font-size:.78rem;color:#6b7280;font-family:system-ui,sans-serif;margin-top:2px}
        .rec-date{font-size:.72rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .rec-save{font-size:1rem;font-weight:700;color:#7DBA47;white-space:nowrap}
        .empty{background:#fff;border:1px dashed #d1cfc6;border-radius:12px;padding:32px 20px;text-align:center}
        .empty-title{font-size:1rem;font-weight:700;margin-bottom:8px}
        .empty-sub{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:18px;line-height:1.5}
        .cta{display:inline-block;background:#1F3D2B;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.88rem}
        .cta:hover{background:#2A4F38}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home"><Logo /></Link>
        <Link href="/deals/all" className="back">← Browse deals</Link>
      </nav>

      <div className="wrap">
        <div className="eyebrow">My savings</div>
        <h1>Your PuffPrice savings</h1>

        {records === null ? (
          <div className="empty"><div className="empty-title">Loading…</div></div>
        ) : records.length === 0 ? (
          <div className="empty">
            <div className="empty-title">You haven&apos;t tracked any deals yet.</div>
            <div className="empty-sub">
              Start by clicking a deal below. We&apos;ll quietly log the savings in your
              browser so you can see what you&apos;ve saved over time.
            </div>
            <Link href="/deals/all" className="cta">See today&apos;s deals →</Link>
          </div>
        ) : (
          <>
            <div className="stat-row">
              <div className="stat primary">
                <div className="stat-label">This month</div>
                <div className="stat-num"><span>$</span>{monthly}</div>
              </div>
              <div className="stat">
                <div className="stat-label">All time</div>
                <div className="stat-num">${lifetime}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Deals used</div>
                <div className="stat-num">{count}</div>
              </div>
            </div>

            <div className="row-head">
              <h2>Recent deals you&apos;ve clicked</h2>
              <button
                type="button"
                className={copied ? "share copied" : "share"}
                onClick={share}
              >
                {copied ? "Copied!" : "Share savings"}
              </button>
            </div>
            <p style={{ fontSize: ".78rem", color: "#6b7280", fontFamily: "system-ui,sans-serif" }}>
              {month} savings: <strong style={{ color: "#7DBA47" }}>${monthly}</strong> · Tap to
              share.
            </p>

            <div className="list">
              {records.slice(0, 40).map((r, i) => (
                <div key={i} className="rec">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="rec-name">{r.dispensary}</div>
                    <div className="rec-title">{r.dealTitle || "Deal"}</div>
                    <div className="rec-date">
                      {new Date(r.clickedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {r.category ? ` · ${r.category}` : ""}
                    </div>
                  </div>
                  <div className="rec-save">${Math.round(r.savingsAmount || 0)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
