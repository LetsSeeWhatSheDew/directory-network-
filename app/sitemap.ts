import type { MetadataRoute } from "next";
import { ALL_ILLINOIS_CITIES } from "@/config/cities/illinois/shared";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://projectgreen.com";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/grow`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/get-listed`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cannabis/illinois`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Dynamic city routes
  const cityRoutes: MetadataRoute.Sitemap = ALL_ILLINOIS_CITIES.map((city) => ({
    url: `${baseUrl}/cannabis/illinois/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Chicago neighborhood routes
  const chicagoNeighborhoods = [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "River North", slug: "river-north" },
    { name: "South Loop", slug: "south-loop" },
    { name: "Wicker Park", slug: "wicker-park" },
    { name: "Logan Square", slug: "logan-square" },
    { name: "Lakeview", slug: "lakeview" },
    { name: "West Loop", slug: "west-loop" },
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ];
  const neighborhoodRoutes: MetadataRoute.Sitemap = chicagoNeighborhoods.map(
    (neighborhood) => ({
      url: `${baseUrl}/cannabis/illinois/chicago/${neighborhood.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  return [...staticRoutes, ...cityRoutes, ...neighborhoodRoutes];
}
