import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/app-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appConfig.systemName} POS`,
    short_name: appConfig.systemName,
    description: "Mobile point of sale and inventory workspace",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "New Sale",
        short_name: "Sale",
        description: "Open the POS checkout",
        url: "/orders/new",
        icons: [{ src: "/app-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "Products",
        short_name: "Products",
        description: "Open product inventory",
        url: "/products",
        icons: [{ src: "/app-icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
