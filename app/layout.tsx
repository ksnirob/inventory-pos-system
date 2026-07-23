import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { getBusinessSettings } from "@/lib/settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();

  return {
    applicationName: settings.systemName,
    title: `${settings.systemName} | POS & Inventory`,
    description: "Modern point of sale, inventory, expense, and reporting workspace",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.systemName
    },
    icons: {
      icon: settings.faviconUrl ?? "/app-icon.svg",
      apple: "/app-icon.svg"
    }
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getBusinessSettings();

  return (
    <html lang="en">
      <body>
        <PwaRegister />
        <AppShell settings={settings}>{children}</AppShell>
      </body>
    </html>
  );
}
