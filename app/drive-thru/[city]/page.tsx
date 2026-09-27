// /drive-thru/[city] — "drive-thru dispensary near {city}": confirmed drive-thrus, else the fastest pickup.
// Built by lib/answers.ts from the same data as the /drive-thru hub.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CENTRAL_IL_CITIES } from "../../../lib/constants/regions";
import { getAnswer } from "../../../lib/answers";
import AnswerView, { answerMetadata } from "../../components/AnswerView";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CENTRAL_IL_CITIES.map((c) => ({ city: c.slug }));
}

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  return answerMetadata(await getAnswer("drive-thru", city));
}

export default async function DriveThruCityPage({ params }: Props) {
  const { city } = await params;
  const a = await getAnswer("drive-thru", city);
  if (!a) notFound();
  return <AnswerView a={a} />;
}
