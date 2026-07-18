"use client";

import { ChevronDown, Filter, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Option = { value: string; label: string };

export function FilterBar({
  search,
  category,
  status,
  product,
  type,
  from,
  to,
  period,
  sort,
  categories = [],
  showTransactionType = false,
  products = []
}: {
  search?: string;
  category?: string;
  status?: string;
  product?: string;
  type?: string;
  from?: string;
  to?: string;
  period?: string;
  sort?: string;
  categories?: Option[];
  showTransactionType?: boolean;
  products?: Option[];
  resetHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [query, setQuery] = useState(search ?? "");
  const [open, setOpen] = useState(false);
  const activeFilterCount = [search, category, status, product, type, from, to, period].filter(Boolean).length;

  function updateFilter(key: string, value: string, extra: Record<string, string> = {}) {
    const params = new URLSearchParams(currentParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    Object.entries(extra).forEach(([extraKey, extraValue]) => {
      if (extraValue) params.set(extraKey, extraValue);
      else params.delete(extraKey);
    });
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
    <div className="relative">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          aria-expanded={open}
        >
          <Filter size={17} />
          Filters
          {activeFilterCount ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-700 px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        {activeFilterCount ? (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={15} />
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
      <div className="absolute left-0 top-14 z-30 grid w-[min(1500px,calc(100vw-3rem))] gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 lg:grid-cols-[minmax(220px,1fr)_repeat(6,minmax(140px,200px))]">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={17} />
          <input name="q" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="Search products, SKU, reports..." className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
        </label>
        {categories.length ? (
          <label className="relative">
            <span className="sr-only">Filter by category</span>
            <select name="category" defaultValue={category} onChange={(event) => updateFilter("category", event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="">All categories</option>
              {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={17} />
          </label>
        ) : null}
        {products.length ? (
          <label className="relative">
            <span className="sr-only">Filter by product</span>
            <select name="product" defaultValue={product} onChange={(event) => updateFilter("product", event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="">All products</option>
              {products.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={17} />
          </label>
        ) : null}
        <label className="relative">
          <span className="sr-only">{showTransactionType ? "Filter by transaction type" : "Filter by stock status"}</span>
          <select name={showTransactionType ? "type" : "status"} defaultValue={showTransactionType ? type : status} onChange={(event) => updateFilter(showTransactionType ? "type" : "status", event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
            {showTransactionType ? <>
              <option value="">All transaction types</option><option value="STOCK_IN">Stock In</option><option value="STOCK_OUT">Stock Out</option><option value="ADJUSTMENT">Adjustment</option>
            </> : <>
              <option value="">All stock statuses</option><option value="IN_STOCK">In Stock</option><option value="LOW_STOCK">Low Stock</option><option value="OUT_OF_STOCK">Out of Stock</option>
            </>}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={17} />
        </label>
        {showTransactionType ? <>
          <label className="relative">
            <span className="sr-only">Date period</span>
            <select name="period" defaultValue={period} onChange={(event) => updateFilter("period", event.target.value, { from: "", to: "" })} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="">All dates</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="custom">Custom range</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={17} />
          </label>
          <label className="relative">
            <span className="sr-only">Sort by date</span>
            <select name="sort" defaultValue={sort} onChange={(event) => updateFilter("sort", event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={17} />
          </label>
          <input type="date" name="from" defaultValue={from} onChange={(event) => updateFilter("from", event.target.value, { period: "custom" })} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" aria-label="From date" />
          <input type="date" name="to" defaultValue={to} onChange={(event) => updateFilter("to", event.target.value, { period: "custom" })} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" aria-label="To date" />
        </> : null}
      </div>
      ) : null}
    </div>
  );
}
