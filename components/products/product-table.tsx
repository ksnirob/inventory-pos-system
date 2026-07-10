import Link from "next/link";
import { ArrowDownUp, Eye, Pencil, Plus } from "lucide-react";
import { deleteProduct } from "@/actions/inventory";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { LinkButton } from "@/components/ui/button";
import { StockBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  purchasePrice: unknown;
  sellingPrice: unknown;
  quantity: unknown;
  minimumStockLevel: unknown;
  category: { name: string };
  supplier: { name: string };
};

export function ProductTable({
  products,
  searchParams
}: {
  products: ProductRow[];
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (products.length === 0) {
    return <EmptyState title="No products found" message="Add your first product or adjust the active filters." />;
  }

  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "createdAt";
  const direction = searchParams.direction === "asc" ? "desc" : "asc";

  function sortHref(key: string) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([paramKey, value]) => {
      if (typeof value === "string") {
        params.set(paramKey, value);
      }
    });
    params.set("sort", key);
    params.set("direction", sort === key ? direction : "asc");
    return `/products?${params.toString()}`;
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {[
                ["name", "Product name"],
                ["sku", "SKU"],
                ["category", "Category"],
                ["supplier", "Supplier"],
                ["purchasePrice", "Purchase price"],
                ["sellingPrice", "Selling price"],
                ["quantity", "Quantity"]
              ].map(([key, label]) => (
                <th key={key} className="px-4 py-3 font-semibold">
                  <Link href={sortHref(key)} className="inline-flex items-center gap-1">
                    {label}
                    <ArrowDownUp size={13} />
                  </Link>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold">Stock status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-md bg-cyan-50 text-xs font-black text-cyan-700">
                        {product.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span>{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                <td className="px-4 py-3 text-slate-600">{product.category.name}</td>
                <td className="px-4 py-3 text-slate-600">{product.supplier.name}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(String(product.purchasePrice))}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(String(product.sellingPrice))}</td>
                <td className="px-4 py-3 text-slate-600">{Number(product.quantity)}</td>
                <td className="px-4 py-3">
                  <StockBadge quantity={Number(product.quantity)} minimumStockLevel={Number(product.minimumStockLevel)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <LinkButton href={`/products/${product.id}`} variant="secondary" className="h-9 px-3">
                      <Eye size={15} />
                    </LinkButton>
                    <LinkButton href={`/products/${product.id}/edit`} variant="secondary" className="h-9 px-3">
                      <Pencil size={15} />
                    </LinkButton>
                    <DeleteButton action={deleteProduct.bind(null, product.id)} label="" confirmMessage="Delete this product and its stock history?" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
        <span>{products.length} product rows shown</span>
        <LinkButton href="/products?modal=product" className="h-9 px-3">
          <Plus size={15} />
          Add product
        </LinkButton>
      </div>
    </div>
  );
}
