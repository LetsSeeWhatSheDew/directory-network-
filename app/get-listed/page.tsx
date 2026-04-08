// app/get-listed/page.tsx
import Link from "next/link";
import { GetListedForm } from "../components/GetListedForm";

export default function GetListedPage() {
  return (
    <main className="min-h-screen bg-[#FFF7E9] text-slate-900">
      {/* Top nav (same as other pages) */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D1B69] text-xs font-semibold text-[#FFF7E9] shadow-sm">
              DN
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                Directory Network
              </span>
              <span className="text-xs text-slate-500">
                New listing request
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to directories
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm md:px-6 md:py-6">
          <GetListedForm />
        </section>
      </div>
    </main>
  );
}