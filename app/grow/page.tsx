import type { Metadata } from "next";
import DirectoryLandingPage from "@/components/DirectoryLandingPage";
import { DIRECTORY_CONFIG } from "@/config/directories/project-green";

export const metadata: Metadata = {
  title: `${DIRECTORY_CONFIG.heroHeadline} | ${DIRECTORY_CONFIG.directoryName}`,
  description: DIRECTORY_CONFIG.heroSubheadline,
  openGraph: {
    title: DIRECTORY_CONFIG.heroHeadline,
    description: DIRECTORY_CONFIG.heroSubheadline,
    siteName: DIRECTORY_CONFIG.directoryName,
  },
};

export default function GrowPage() {
  return <DirectoryLandingPage config={DIRECTORY_CONFIG} />;
}
