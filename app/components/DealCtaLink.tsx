"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type DealInfo = {
  dispensary: string;
  dealTitle: string;
  savingsAmount: number;
  category: string | null;
};

type Props = ComponentProps<typeof Link> & {
  deal: DealInfo;
  children: ReactNode;
};

const STORAGE_KEY = "cl_savings_log";
const MAX_RECORDS = 200;

function recordClick(deal: DealInfo) {
  try {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    const safe = Array.isArray(arr) ? arr : [];
    const entry = {
      dispensary: deal.dispensary,
      dealTitle: deal.dealTitle,
      savingsAmount: Number.isFinite(deal.savingsAmount) ? deal.savingsAmount : 0,
      category: deal.category,
      clickedAt: Date.now(),
    };
    safe.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe.slice(0, MAX_RECORDS)));
  } catch {}
}

export default function DealCtaLink({ deal, onClick, children, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        recordClick(deal);
        try {
          const w = window as any;
          if (typeof w.gtag === "function") {
            w.gtag("event", "deal_cta_click", {
              dispensary: deal.dispensary,
              category: deal.category || "unknown",
              savings: deal.savingsAmount,
            });
          }
        } catch {}
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
