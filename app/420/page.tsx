// app/420/page.tsx — the 4/20 hub (lib/events.ts, components/EventHub).
import type { Metadata } from "next";
import EventHub from "../components/EventHub";
import { brand } from "../../lib/brand";
import { eventById } from "../../lib/events";

export const revalidate = 900;

const EV = eventById("420-2027")!;

export const metadata: Metadata = {
  title: "4/20 2027 Dispensary Deals in Central Illinois",
  description:
    "4/20 is Tuesday, April 20, 2027. Every Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield dispensary deal on one page that morning, checked on each store's own site. Get one email that morning.",
  alternates: { canonical: `${brand.url}${EV.path}` },
};

export default function FourTwentyPage() {
  return (
    <EventHub
      ev={EV}
      extraFaqs={[
        {
          q: "Do Central Illinois dispensaries run 4/20 sales?",
          a: "Many do, and some post them ahead of time. Anything a store has announced on its own site shows up on this page under \"Announced early\" after our next morning check.",
        },
      ]}
    />
  );
}
