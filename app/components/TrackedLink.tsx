"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Props = ComponentProps<typeof Link> & {
  event: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  children: ReactNode;
};

export default function TrackedLink({ event, params, children, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        try {
          const w = window as any;
          if (typeof w.gtag === "function") {
            w.gtag("event", event, params || {});
          }
        } catch {}
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
