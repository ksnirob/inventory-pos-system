import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StockBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatQuantity, formatStockTransactionType } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      supplier: true,
      transactions: { orderBy: { transactionDate: "desc" }, take: 12 }
    }
  });

  if (!product) {
    notFound();
  }
  const productImageUrl = product.imageMimeType ? `/api/products/${product.id}/image` : product.imageUrl;

  return (
    <>
      <PageHeader title={product.name} description={`SKU ${product.sku}`} action={{ href: `/products/${product.id}/edit`, label: "Edit product" }} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-md border border-slate-200 bg-white p-5">
          {productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={productImageUrl} alt={product.name} className="mb-5 h-56 w-full rounded-md object-cover" />
          ) : (
            <div className="mb-5 grid h-56 place-items-center rounded-md bg-emerald-50 text-4xl font-black text-emerald-700">
              {product.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-slate-950">Product details</h2>
            <StockBadge quantity={Number(product.quantity)} minimumStockLevel={Number(product.minimumStockLevel)} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Category", product.category.name],
              ["Supplier", product.supplier.name],
              ["Purchase price", formatCurrency(String(product.purchasePrice))],
              ["Selling price", formatCurrency(String(product.sellingPrice))],
              ["Quantity", formatQuantity(String(product.baseQuantity), product.unit)],
              ["Current quantity", formatQuantity(String(product.quantity), product.unit)],
              ["Minimum stock level", String(product.minimumStockLevel)],
              ["Created", formatDate(product.createdAt)],
              ["Updated", formatDate(product.updatedAt)]
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          {product.description ? <p className="mt-5 text-sm leading-6 text-slate-600">{product.description}</p> : null}
        </section>
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Recent transactions</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {product.transactions.map((transaction) => (
              <div key={transaction.id} className="px-5 py-4 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-medium text-slate-900">{formatStockTransactionType(transaction.type, transaction.note, transaction.referenceNumber)}</p>
                <p className="font-semibold text-slate-900">{Number(transaction.previousQuantity)} → {Number(transaction.newQuantity)}</p>
                </div>
                <p className="text-slate-500">{formatDate(transaction.transactionDate)} · Qty {Number(transaction.quantity)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-6">
        <LinkButton href="/products" variant="secondary">Back to products</LinkButton>
      </div>
    </>
  );
}
