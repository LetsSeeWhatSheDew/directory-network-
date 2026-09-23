import { MetadataRoute } from "next";
import { brand } from "../lib/brand";

// AI answer engines are a first-class channel: every major AI crawler is
// explicitly welcome, and so is the public deals feed (/api/public/*).
const AI_BOTS = [
  "OAI-SearchBot", "ChatGPT-User", "GPTBot",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot", "Applebot-Extended",
  "Bingbot", "DuckDuckBot", "CCBot", "Amazonbot", "meta-externalagent",
];
const DISALLOW = ["/admin", "/api/", "/notify/", "/lab/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: ["/", "/api/public/", "/llms.txt", "/llms-full.txt"], disallow: DISALLOW })),
      { userAgent: "*", allow: ["/", "/api/public/"], disallow: DISALLOW },
    ],
    sitemap: `${brand.url}/sitemap.xml`,
    host: brand.url,
  };
}
