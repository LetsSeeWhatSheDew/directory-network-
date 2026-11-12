"use client";
// Open-in-place, shared by the round-2 concepts. The trigger is a real
// <button aria-expanded>; the panel is server-rendered children, so the facts
// inside it come straight from the page's data. Height animates with the
// grid-rows trick (transform-free, so numbers never move); reduce-motion = instant.
import { useState, useId } from "react";

export default function Disclosure({
  label,
  openLabel,
  startOpen = false,
  className,
  panelClassName,
  children,
  trigger,
}: {
  label: React.ReactNode;
  openLabel?: React.ReactNode;
  startOpen?: boolean;
  className?: string;
  panelClassName?: string;
  children: React.ReactNode;
  /** Optional extra content rendered inside the button above the label (e.g. a whole deal row). */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);
  const id = useId();
  return (
    <>
      <button type="button" className={className} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {trigger}
        <span className="dx-label">
          <span>{open ? openLabel ?? label : label}</span>
          <span className="dx-mark" aria-hidden="true" />
        </span>
      </button>
      <div
        id={id}
        role="region"
        aria-hidden={!open}
        className={panelClassName}
        style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .36s cubic-bezier(.2,.8,.2,1)" }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }} inert={!open}>
          {children}
        </div>
      </div>
    </>
  );
}
