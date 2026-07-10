"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Menu,
  Package,
  ReceiptText,
  ShoppingCart,
  Truck,
  UsersRound,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { QuickActions } from "@/components/quick-actions";

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
  { href: "/reports", label: "Reports", icon: BarChart3 }
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
  "/reports": "Business reports"
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pageTitle = titles[pathname] ?? (pathname.startsWith("/orders/") ? "Sale details" : "Inventory workspace");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/orders/new") return pathname === "/orders/new";
    if (href === "/orders") return pathname === "/orders" || (pathname.startsWith("/orders/") && pathname !== "/orders/new");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <aside className="flex h-full w-[260px] flex-col border-r border-slate-200 bg-white text-slate-950">
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ff6b4a] text-white shadow-lg shadow-orange-200">
            <ShoppingCart size={19} strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold tracking-tight">OrderDesk</span>
            <span className="block text-[11px] font-medium text-slate-400">Retail operations</span>
          </span>
        </Link>
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-950 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <div className="px-3 pt-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
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

      <div className="mx-4 mt-auto mb-4 border-t border-slate-100 pt-4" />
    </aside>
  );

  return (
    <div className="min-h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[260px] shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-950">{pageTitle}</p>
              <p className="hidden text-xs text-slate-500 sm:block">OrderDesk / {pageTitle}</p>
            </div>
          </div>
          <QuickActions />
        </header>
        <main className="mx-auto max-w-[1540px] p-4 sm:p-6 lg:p-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          Developed by <span className="font-semibold text-slate-600">Khaled Saifullah</span>
          <span className="mx-2 text-slate-300">·</span>
          <a href="https://ksnirob.com" target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 hover:text-emerald-900">ksnirob.com</a>
        </footer>
      </div>
    </div>
  );
}
