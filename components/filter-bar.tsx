"use client";

import { RefreshCw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/button";

type Option = { value: string; label: string };

export function FilterBar({
  search,
  category,
  status,
  product,
  type,
  from,
  to,
  categories = [],
  showTransactionType = false,
  products = [],
  resetHref
}: {
  search?: string;
  category?: string;
  status?: string;
  product?: string;
  type?: string;
  from?: string;
  to?: string;
  categories?: Option[];
  showTransactionType?: boolean;
  products?: Option[];
  resetHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [query, setQuery] = useState(search ?? "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(currentParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const activeQuery = currentParams.get("q") ?? "";
    if (query === activeQuery) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(currentParams.toString());
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      params.delete("page");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [currentParams, pathname, query, router]);

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
      <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_auto]">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={17} />
          <input name="q" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="Search products, SKU, reports..." className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
        </label>
        <div className="flex gap-2">
          <LinkButton href={resetHref} onClick={() => setQuery("")} variant="secondary" className="h-11 px-3" title="Reset filters">
            <RefreshCw size={16} /><span className="hidden sm:inline">Reset</span>
          </LinkButton>
        </div>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {categories.length ? (
          <select name="category" defaultValue={category} onChange={(event) => updateFilter("category", event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        ) : null}
        {products.length ? (
          <select name="product" defaultValue={product} onChange={(event) => updateFilter("product", event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
            <option value="">All products</option>
            {products.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        ) : null}
        <select name={showTransactionType ? "type" : "status"} defaultValue={showTransactionType ? type : status} onChange={(event) => updateFilter(showTransactionType ? "type" : "status", event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
          {showTransactionType ? <>
            <option value="">All transaction types</option><option value="STOCK_IN">Stock In</option><option value="STOCK_OUT">Stock Out</option><option value="ADJUSTMENT">Adjustment</option>
          </> : <>
            <option value="">All stock statuses</option><option value="IN_STOCK">In Stock</option><option value="LOW_STOCK">Low Stock</option><option value="OUT_OF_STOCK">Out of Stock</option>
          </>}
        </select>
        {showTransactionType ? <>
          <input type="date" name="from" defaultValue={from} onChange={(event) => updateFilter("from", event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" aria-label="From date" />
          <input type="date" name="to" defaultValue={to} onChange={(event) => updateFilter("to", event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" aria-label="To date" />
        </> : null}
      </div>
    </div>
  );
}
