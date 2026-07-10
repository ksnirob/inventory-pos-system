"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, FolderTree, Home, Package, ReceiptText, Search, ShoppingCart, Truck, X } from "lucide-react";

const actions = [
  { href: "/", label: "Dashboard", hint: "Overview and recent activity", icon: Home },
  { href: "/orders/new", label: "POS Checkout", hint: "Scan, cart, payment, complete sale", icon: ShoppingCart },
  { href: "/orders", label: "Sales History", hint: "Track POS sales and payslips", icon: ShoppingCart },
  { href: "/products", label: "Products", hint: "Inventory items and stock status", icon: Package },
  { href: "/stock", label: "Stock Management", hint: "Stock in, out, and adjustment", icon: Boxes },
  { href: "/expenses", label: "Expenses", hint: "Business costs and profit tracking", icon: ReceiptText },
  { href: "/categories", label: "Categories", hint: "Product groups", icon: FolderTree },
  { href: "/suppliers", label: "Suppliers", hint: "Vendor contact records", icon: Truck },
  { href: "/reports", label: "Reports", hint: "Inventory and transaction exports", icon: BarChart3 }
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return actions;
    return actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(needle));
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full max-w-[360px] items-center justify-between rounded-md border border-cyan-100 bg-gradient-to-r from-white to-cyan-50 px-3 text-sm text-stone-600 shadow-sm shadow-cyan-100 transition hover:border-cyan-300 hover:bg-white"
      >
        <span className="flex items-center gap-2">
          <Search size={16} className="text-cyan-700" />
          <span className="hidden sm:inline">Search pages and actions</span>
          <span className="sm:hidden">Search</span>
        </span>
        <kbd className="rounded border border-cyan-100 bg-white px-1.5 py-0.5 text-xs font-semibold text-cyan-700">Ctrl K</kbd>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-start bg-stone-950/35 px-4 py-20 backdrop-blur-sm sm:place-items-center sm:py-4">
          <button className="absolute inset-0" aria-label="Close quick actions" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-md border border-cyan-100 bg-white shadow-2xl shadow-stone-950/20">
            <div className="flex items-center gap-3 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-amber-50 px-4 py-3">
              <Search size={18} className="text-cyan-700" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search orders, products, reports..."
                className="h-10 flex-1 bg-transparent text-sm outline-none"
              />
              <button type="button" className="rounded-md p-2 text-stone-500 hover:bg-white" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {filtered.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-3 transition hover:bg-cyan-50"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-cyan-600 to-amber-400 text-white">
                      <Icon size={17} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-stone-950">{action.label}</span>
                      <span className="text-xs text-stone-500">{action.hint}</span>
                    </span>
                  </Link>
                );
              })}
              {filtered.length === 0 ? <p className="px-3 py-8 text-center text-sm text-stone-500">No matching action found.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
