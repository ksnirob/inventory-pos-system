import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Option = { value: string; label: string };

export function FilterBar({
  search,
  categories = [],
  showTransactionType = false,
  products = []
}: {
  search?: string;
  categories?: Option[];
  showTransactionType?: boolean;
  products?: Option[];
}) {
  return (
    <form className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_180px_180px_auto]">
      <label className="relative">
        <span className="sr-only">Search</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          name="q"
          defaultValue={search}
          placeholder="Search..."
          className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </label>
      {categories.length ? (
        <select name="category" className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
        </select>
      ) : null}
      {products.length ? (
        <select name="product" className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
          <option value="">All products</option>
          {products.map((product) => <option key={product.value} value={product.value}>{product.label}</option>)}
        </select>
      ) : null}
      <select name={showTransactionType ? "type" : "status"} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
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
      <Button type="submit" variant="secondary">Apply</Button>
    </form>
  );
}
