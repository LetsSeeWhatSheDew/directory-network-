"use client";

import { useState } from "react";

type DispensaryResult = {
  slug: string;
  platform: string;
  status: "success" | "failed" | "skipped";
  deals_added: number;
  deals_updated: number;
  deals_deactivated: number;
  error_message: string | null;
};

const STATUS_BADGE: Record<DispensaryResult["status"], string> = {
  success: "bg-[#7DBA47]/15 text-[#7DBA47]",
  failed: "bg-[#E24B4A]/15 text-[#E24B4A]",
  skipped: "bg-white/5 text-[#8a9490]",
};

export function ScraperRunRow({ result }: { result: DispensaryResult }) {
  const [open, setOpen] = useState(false);
  const hasError = result.error_message && result.error_message.length > 0;

  return (
    <>
      <tr
        className={`border-b border-white/[0.03] ${hasError ? "cursor-pointer" : ""} transition-colors hover:bg-white/[0.02]`}
        onClick={() => hasError && setOpen(!open)}
      >
        <td className="py-3 pr-4 font-medium">{result.slug}</td>
        <td className="py-3 pr-4 text-[#8a9490]">{result.platform}</td>
        <td className="py-3 pr-4">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[result.status]}`}
          >
            {result.status}
          </span>
        </td>
        <td className="py-3 pr-4 text-right text-[#F7F4ED]">
          {result.deals_added}
        </td>
        <td className="py-3 pr-4 text-right text-[#8a9490]">
          {result.deals_updated}
        </td>
        <td className="py-3 pr-4 text-right text-[#8a9490]">
          {result.deals_deactivated}
        </td>
        <td className="py-3 pr-4 text-xs text-[#E24B4A]/80">
          {hasError ? (
            <span>
              {open ? "Hide" : "Show"} error
            </span>
          ) : (
            <span className="text-[#8a9490]">—</span>
          )}
        </td>
      </tr>
      {hasError && open && (
        <tr className="border-b border-white/[0.03]">
          <td colSpan={7} className="bg-black/30 px-4 py-3 text-xs text-[#E24B4A]/90">
            <pre className="whitespace-pre-wrap break-words font-mono">
              {result.error_message}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
