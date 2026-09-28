"use client";
// One-tap copy for a caption on /social. Falls back to selecting the text
// when the clipboard API isn't available (older iOS, http previews).
import { useRef, useState } from "react";

export default function CopyCaption({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      ref.current?.select();
      document.execCommand?.("copy");
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <div className="so-cap">
      <textarea ref={ref} readOnly value={text} rows={Math.min(20, text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 52)), 1))} aria-label="Caption" />
      <button type="button" className="so-btn" onClick={copy}>{done ? "Copied" : "Copy caption"}</button>
    </div>
  );
}
