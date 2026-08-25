import type { MetadataRoute } from "next";

// mobile-porter (M11): manifest generado, iconos 192/512 (uno maskable),
// display standalone y colores alineados a la paleta oscura fija del sitio
// (--bg: #0a0a0f, acento --cyan: #00f5ff — ver app/globals.css:14,20).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arcade Vault",
    short_name: "Arcade Vault",
    description: "Juega en línea y compite por el puntaje más alto.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
