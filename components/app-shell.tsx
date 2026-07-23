"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  Ellipsis,
  FolderTree,
  LayoutDashboard,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  UsersRound,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { QuickActions } from "@/components/quick-actions";
import type { RuntimeSettings } from "@/lib/settings";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders/new", label: "Point of sale", icon: ShoppingCart, featured: true },
  { href: "/orders", label: "Sales history", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

const mobileNavigation = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/orders/new", label: "POS", icon: ShoppingCart, featured: true },
  { href: "/orders", label: "Sales", icon: ClipboardList },
  { href: "/products", label: "Products", icon: Package }
];

const titles: Record<string, string> = {
  "/": "Business overview",
  "/orders/new": "Point of sale",
  "/orders": "Sales history",
  "/customers": "Customers",
  "/products": "Product catalog",
  "/categories": "Categories",
  "/suppliers": "Suppliers",
  "/stock": "Stock management",
  "/expenses": "Expenses",
  "/reports": "Business reports",
  "/settings": "Settings"
};

export function AppShell({ children, settings }: { children: React.ReactNode; settings: RuntimeSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pageTitle = titles[pathname] ?? (pathname.startsWith("/orders/") ? "Sale details" : "Inventory workspace");

  if (pathname === "/login") {
    return <>{children}</>;
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/orders/new") return pathname === "/orders/new";
    if (href === "/orders") return pathname === "/orders" || (pathname.startsWith("/orders/") && pathname !== "/orders/new");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <aside className="flex h-full w-[260px] flex-col border-r border-slate-200 bg-white text-slate-950 max-lg:w-[min(86vw,320px)] max-lg:rounded-r-2xl max-lg:border-slate-100">
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
        <Link href="/" className={cn("flex min-w-0", settings.logoUrl ? "flex-col items-start gap-1" : "items-center gap-3")} onClick={() => setOpen(false)}>
          {settings.logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logoUrl} alt={settings.systemName} className="max-h-9 max-w-[150px] shrink-0 object-contain" />
              <span className="min-w-0 max-w-[190px]">
                <span className="block truncate text-[11px] font-medium text-slate-400">{settings.systemTagline}</span>
              </span>
            </>
          ) : (
            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight">{settings.systemName}</span>
              <span className="block truncate text-[11px] font-medium text-slate-400">{settings.systemTagline}</span>
            </span>
          )}
        </Link>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-950 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <div className="px-3 pt-5">
        {/* <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p> */}
        <nav className="grid gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-md px-3 text-[13px] font-semibold transition",
                  active ? "bg-emerald-50 text-emerald-900 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <Icon size={18} className={active ? "text-emerald-600" : item.featured ? "text-[#ff6b4a]" : "text-slate-400 group-hover:text-slate-700"} />
                <span className="flex-1">{item.label}</span>
                {active ? <ChevronRight size={15} className="text-slate-400" /> : null}
              </Link>
            );
          })}
        </nav>
      </div>

    </aside>
  );

  return (
    <div className="min-h-screen max-lg:bg-slate-100">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[260px] shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl max-lg:h-[calc(64px+env(safe-area-inset-top))] max-lg:border-slate-100 max-lg:bg-white/90 max-lg:pt-[env(safe-area-inset-top)] max-lg:shadow-sm max-lg:shadow-slate-900/5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm max-lg:rounded-2xl max-lg:border-slate-100 max-lg:bg-slate-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-950 max-lg:text-[15px]">{pageTitle}</p>
              <p className="hidden text-xs text-slate-500 sm:block">{settings.systemName} / {pageTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <QuickActions />
            <div className="hidden sm:block">
              <LogoutButton compact />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1540px] p-4 pb-[calc(96px+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(104px+env(safe-area-inset-bottom))] lg:p-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden" aria-label="Mobile primary navigation">
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
            {mobileNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition",
                    active ? "bg-emerald-50 text-emerald-800" : "text-slate-500 active:bg-slate-100"
                  )}
                >
                  <Icon size={20} className={active ? "text-emerald-700" : item.featured ? "text-[#ff6b4a]" : "text-slate-500"} />
                  <span className="w-full truncate text-center">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold text-slate-500 transition active:bg-slate-100"
              aria-label="Open more navigation"
            >
              <Ellipsis size={20} />
              <span className="w-full truncate text-center">More</span>
            </button>
          </div>
        </nav>
        <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-400 max-lg:hidden sm:px-6 lg:px-8">
          Developed by <a href="https://ksnirob.com" target="_blank" rel="noreferrer" className="font-semibold text-slate-600 hover:text-emerald-800">Khaled Saifullah</a>
        </footer>
      </div>
    </div>
  );
}

