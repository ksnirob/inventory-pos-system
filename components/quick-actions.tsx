"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Boxes, FolderTree, Home, Package, ReceiptText, Search, ShoppingCart, Truck, UsersRound, X } from "lucide-react";

const actions = [
  { href: "/", label: "Dashboard", hint: "Overview and recent activity", icon: Home },
  { href: "/orders/new", label: "POS Checkout", hint: "Scan, cart, payment, complete sale", icon: ShoppingCart },
  { href: "/orders", label: "Sales History", hint: "Track POS sales and payslips", icon: ShoppingCart },
  { href: "/customers", label: "Customers", hint: "Contacts and purchase history", icon: UsersRound },
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return actions;
    return actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(needle));
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-auto sm:w-[340px]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition hover:border-emerald-300 hover:bg-white hover:shadow-sm"
      >
        <span className="flex items-center gap-2">
          <Search size={16} className="text-slate-400" />
          <span className="hidden sm:inline">Search pages and actions</span>
          <span className="sm:hidden">Search</span>
        </span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Ctrl K</kbd>
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,430px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={18} className="text-emerald-600" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search orders, products, reports..."
                className="h-10 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
              />
              <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-white" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[min(420px,65vh)] overflow-y-auto p-2">
              {filtered.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 rounded-md px-3 py-3 transition hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
                      <Icon size={17} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-950">{action.label}</span>
                      <span className="text-xs text-slate-500">{action.hint}</span>
                    </span>
                  </Link>
                );
              })}
              {filtered.length === 0 ? <p className="px-3 py-8 text-center text-sm text-stone-500">No matching action found.</p> : null}
            </div>
        </div>
      ) : null}
    </div>
  );
}
