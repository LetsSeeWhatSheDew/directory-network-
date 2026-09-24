import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PuffPrice",
    short_name: "PuffPrice",
    description: "Central Illinois cannabis deals, checked every morning.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F1E8",
    theme_color: "#F6F1E8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
