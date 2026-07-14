import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getBusinessSettings } from "@/lib/settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();

  return {
    title: `${settings.systemName} | POS & Inventory`,
    description: "Modern point of sale, inventory, expense, and reporting workspace",
    icons: {
      icon: settings.faviconUrl ?? "/api/settings/favicon"
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getBusinessSettings();

  return (
    <html lang="en">
      <body>
        <AppShell settings={settings}>{children}</AppShell>
      </body>
    </html>
  );
}
