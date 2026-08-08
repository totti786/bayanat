import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bayanat — Bilingual Invoicing",
    short_name: "Bayanat",
    description: "Bilingual invoicing for Arabic and English",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4f0",
    theme_color: "#1d3836",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
