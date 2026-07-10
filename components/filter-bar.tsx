"use client";

import { useState } from "react";
import { Filter, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(false);
  const hasFilters = Boolean(search || category || status || product || type || from || to);

  return (
    <div className="mb-5 rounded-md border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-amber-50 p-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form className="relative flex-1">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600" size={17} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search products, SKU, reports..."
            className="h-11 w-full rounded-md border border-cyan-100 bg-white pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </form>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-bold text-white shadow-sm shadow-cyan-200 transition hover:bg-cyan-800"
          >
            <Filter size={16} />
            Filter
            {hasFilters ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-300 px-1 text-xs text-stone-950">on</span> : null}
          </button>
          <LinkButton href={resetHref} variant="secondary" className="h-11 justify-center px-4">
            <RefreshCw size={16} />
            Reset
          </LinkButton>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-start bg-stone-950/40 px-4 py-16 backdrop-blur-sm sm:place-items-center sm:py-4">
          <button className="absolute inset-0" type="button" aria-label="Close filters" onClick={() => setOpen(false)} />
          <form className="relative w-full max-w-3xl overflow-hidden rounded-md border border-cyan-100 bg-white shadow-2xl shadow-stone-950/20">
            <div className="flex items-center justify-between border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-amber-50 px-5 py-4">
              <div>
                <h2 className="font-bold text-stone-950">Search filters</h2>
                <p className="text-sm text-stone-500">Choose filters and apply them to this page.</p>
              </div>
              <button type="button" className="rounded-md p-2 text-stone-500 hover:bg-white" onClick={() => setOpen(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              <label className="relative md:col-span-2">
                <span className="sr-only">Search</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600" size={17} />
                <input
                  name="q"
                  defaultValue={search}
                  placeholder="Search..."
                  className="h-11 w-full rounded-md border border-stone-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
              {categories.length ? (
                <select name="category" defaultValue={category} className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100">
                  <option value="">All categories</option>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              ) : null}
              {products.length ? (
                <select name="product" defaultValue={product} className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100">
                  <option value="">All products</option>
                  {products.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              ) : null}
              <select name={showTransactionType ? "type" : "status"} defaultValue={showTransactionType ? type : status} className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100">
                {showTransactionType ? (
                  <>
                    <option value="">All transaction types</option>
                    <option value="STOCK_IN">Stock In</option>
                    <option value="STOCK_OUT">Stock Out</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </>
                ) : (
                  <>
                    <option value="">All stock statuses</option>
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </>
                )}
              </select>
              {showTransactionType ? (
                <>
                  <input type="date" name="from" defaultValue={from} className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" aria-label="From date" />
                  <input type="date" name="to" defaultValue={to} className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" aria-label="To date" />
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 px-5 py-4">
              <LinkButton href={resetHref} variant="secondary">Reset</LinkButton>
              <Button type="submit">Apply filters</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
