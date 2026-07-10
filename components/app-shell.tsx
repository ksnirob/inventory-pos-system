"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  FolderTree,
  Home,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Truck,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { QuickActions } from "@/components/quick-actions";

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/orders/new", label: "POS", icon: ShoppingCart },
  { href: "/orders", label: "Sales History", icon: ClipboardList },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/stock", label: "Stock Management", icon: Boxes },
  { href: "/reports", label: "Reports", icon: BarChart3 }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/orders/new") return pathname === "/orders/new";
    if (href === "/orders") return pathname === "/orders" || (pathname.startsWith("/orders/") && pathname !== "/orders/new");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-stone-200 bg-white text-stone-950 shadow-xl shadow-stone-300/20">
      <div className="flex h-20 items-center justify-between border-b border-stone-200 px-5">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-stone-900 text-white shadow-sm">
            <ClipboardCheck size={19} />
          </span>
          <span>
            <span className="block text-base">OrderDesk</span>
            <span className="block text-xs font-medium text-stone-500">Orders and inventory</span>
          </span>
        </Link>
        <button className="rounded-md p-2 text-stone-500 hover:bg-stone-100 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>
      <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500">
        <Search size={16} />
        Manage customer orders
      </div>
      <nav className="grid gap-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mx-4 mt-auto mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <ClipboardList size={16} />
          Order-first workflow
        </div>
        <p className="text-xs leading-5 text-amber-900/80">New orders automatically reserve stock and write movement history.</p>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-stone-950/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-stone-200 bg-white/85 px-4 shadow-sm shadow-stone-200/70 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-4">
            <button className="rounded-md border border-stone-200 bg-white p-2 shadow-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">Order Management</p>
              <p className="hidden text-sm text-stone-500 sm:block">Orders, customers, stock, and reporting</p>
            </div>
          </div>
          <QuickActions />
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
