// /best-deals/[city] — "best weed deals in {city} today": the biggest everyday discount a store has posted on its own site.
// Built by lib/answers.ts from the same live deals as the /guides pages.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CENTRAL_IL_CITIES } from "../../../lib/constants/regions";
import { getAnswer } from "../../../lib/answers";
import AnswerView, { answerMetadata } from "../../components/AnswerView";

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CENTRAL_IL_CITIES.map((c) => ({ city: c.slug }));
}

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  return answerMetadata(await getAnswer("best-deals", city));
}

export default async function BestDealsCityPage({ params }: Props) {
  const { city } = await params;
  const a = await getAnswer("best-deals", city);
  if (!a) notFound();
  return <AnswerView a={a} />;
}
