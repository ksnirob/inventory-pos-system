"use client";

import { ArrowDownUp, ChevronDown, Eye, Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { deleteProduct } from "@/actions/inventory";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { StockBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatCurrency, getStockStatus } from "@/lib/utils";

type ProductItem = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  purchasePrice: string;
  sellingPrice: string;
  quantity: number;
  unit: string;
  minimumStockLevel: number;
  category: { id: string; name: string };
  supplier: { name: string };
};

type SortKey = "name" | "sku" | "category" | "supplier" | "purchasePrice" | "sellingPrice" | "quantity";
const pageSize = 10;

export function ProductCatalog({ products, categories }: { products: ProductItem[]; categories: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle);
      const matchesCategory = !category || product.category.id === category;
      const matchesStatus = !status || getStockStatus(product.quantity, product.minimumStockLevel) === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [category, products, query, status]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const left = sort === "category" ? a.category.name : sort === "supplier" ? a.supplier.name : a[sort];
    const right = sort === "category" ? b.category.name : sort === "supplier" ? b.supplier.name : b[sort];
    return String(left).localeCompare(String(right), undefined, { numeric: true }) * (direction === "asc" ? 1 : -1);
  }), [direction, filtered, sort]);

  const totalPages = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const activePage = Math.min(page, totalPages);
  const visibleProducts = sorted.slice((activePage - 1) * pageSize, activePage * pageSize);

  function updateSort(key: SortKey) {
    if (sort === key) setDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSort(key); setDirection("asc"); }
    setPage(1);
  }

  return (
    <>
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={17} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} autoComplete="off" placeholder="Search product name or SKU" className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by category</span>
            <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={17} />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by stock status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="">All stock statuses</option><option value="IN_STOCK">In Stock</option><option value="LOW_STOCK">Low Stock</option><option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={17} />
          </label>
        </div>
      </div>

      {visibleProducts.length === 0 ? <EmptyState title="No products found" message="Try a different product name, SKU, category, or stock status." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr>
              {([ ["name", "Product name"], ["sku", "SKU"], ["category", "Category"], ["supplier", "Supplier"], ["purchasePrice", "Purchase price"], ["sellingPrice", "Selling price"], ["quantity", "Quantity"] ] as [SortKey, string][]).map(([key, label]) => (
                <th key={key} className="px-4 py-3 font-semibold"><button type="button" onClick={() => updateSort(key)} className="inline-flex items-center gap-1 hover:text-emerald-700">{label}<ArrowDownUp size={13} /></button></th>
              ))}
              <th className="px-4 py-3">Stock status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{visibleProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><div className="flex items-center gap-3">{product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                ) : <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-xs font-black text-emerald-700">{product.name.slice(0, 2).toUpperCase()}</span>}<span className="font-semibold text-slate-950">{product.name}</span></div></td>
                <td className="px-4 py-3 text-slate-600">{product.sku}</td><td className="px-4 py-3 text-slate-600">{product.category.name}</td><td className="px-4 py-3 text-slate-600">{product.supplier.name}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(product.purchasePrice)}</td><td className="px-4 py-3 text-slate-600">{formatCurrency(product.sellingPrice)}</td><td className="px-4 py-3 font-medium text-slate-700">{product.quantity} <span className="text-xs text-slate-500">{product.unit}</span></td>
                <td className="px-4 py-3"><StockBadge quantity={product.quantity} minimumStockLevel={product.minimumStockLevel} /></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2"><LinkButton href={`/products/${product.id}`} variant="secondary" className="h-9 px-3" title="View"><Eye size={15} /></LinkButton><LinkButton href={`/products/${product.id}/edit`} variant="secondary" className="h-9 px-3" title="Edit"><Pencil size={15} /></LinkButton><DeleteButton action={deleteProduct.bind(null, product.id)} label="" confirmMessage="Delete this product and its stock history?" /></div></td>
              </tr>
            ))}</tbody>
          </table></div>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500"><span>{filtered.length} product rows found</span><LinkButton href="/products?modal=product" className="h-9 px-3"><Plus size={15} />Add product</LinkButton></div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>Page {activePage} of {totalPages}</span><div className="flex gap-2"><button type="button" disabled={activePage === 1} onClick={() => setPage((current) => Math.max(current - 1, 1))} className="h-9 rounded-lg border border-slate-200 bg-white px-3 font-semibold disabled:opacity-40">Previous</button><button type="button" disabled={activePage === totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))} className="h-9 rounded-lg border border-slate-200 bg-white px-3 font-semibold disabled:opacity-40">Next</button></div></div>
    </>
  );
}
