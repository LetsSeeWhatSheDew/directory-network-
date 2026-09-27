// /cheapest/[city]/[item] — one question, one city: "cheapest eighth in
// Peoria", "cheapest vape cart in Normal", "cheapest edibles in Urbana".
// The answer comes from the same menu board as /cheapest (lib/answers.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CENTRAL_IL_CITIES } from "../../../../lib/constants/regions";
import { CHEAPEST_ITEMS, getAnswer } from "../../../../lib/answers";
import AnswerView, { answerMetadata } from "../../../components/AnswerView";

export const revalidate = 900;
export const dynamicParams = false;

export function generateStaticParams() {
  return CENTRAL_IL_CITIES.flatMap((c) => Object.keys(CHEAPEST_ITEMS).map((item) => ({ city: c.slug, item })));
}

type Props = { params: Promise<{ city: string; item: string }> };

async function load({ params }: Props) {
  const { city, item } = await params;
  const def = CHEAPEST_ITEMS[item];
  return def ? getAnswer(def.topic, city) : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return answerMetadata(await load(props));
}

export default async function CheapestItemPage(props: Props) {
  const a = await load(props);
  if (!a) notFound();
  return <AnswerView a={a} />;
}
