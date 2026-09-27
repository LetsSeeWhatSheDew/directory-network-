// app/710/page.tsx — the 7/10 hub (lib/events.ts, components/EventHub).
import type { Metadata } from "next";
import EventHub from "../components/EventHub";
import { brand } from "../../lib/brand";
import { eventById } from "../../lib/events";

export const revalidate = 900;

const EV = eventById("710-2027")!;

export const metadata: Metadata = {
  title: "7/10 2027 Concentrate and Vape Deals in Central Illinois",
  description:
    "7/10 is Saturday, July 10, 2027, the day dispensaries discount concentrates and vape carts. Every Central Illinois deal on one page that morning, checked on each store's own site. Get one email that morning.",
  alternates: { canonical: `${brand.url}${EV.path}` },
};

export default function SevenTenPage() {
  return (
    <EventHub
      ev={EV}
      extraFaqs={[
        {
          q: "Why are concentrates taxed more in Illinois?",
          a: "Illinois taxes cannabis over 35% THC, which covers nearly all concentrates and vape carts, at a 25% state excise rate instead of 10% for flower, before sales and local taxes. A 7/10 discount comes off the shelf price, so the tax shrinks with it.",
        },
      ]}
    />
  );
}
