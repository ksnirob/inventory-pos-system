import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StockForm } from "@/components/forms/stock-form";
import { ModalShell } from "@/components/modal-shell";
import { prisma } from "@/lib/prisma";
import { formatDate, formatQuantity, formatStockTransactionType } from "@/lib/utils";

export default async function StockPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const modal = typeof resolvedSearchParams.modal === "string" ? resolvedSearchParams.modal : "";
  const [products, transactions] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.stockTransaction.findMany({
      include: { product: true },
      orderBy: { transactionDate: "desc" },
      take: 25
    })
  ]);

  return (
    <>
      <PageHeader
        title="Stock Management"
        description="Record stock in, stock out, and adjustment transactions."
        action={{ href: "/stock?modal=stock", label: "Record stock", icon: <Plus size={16} /> }}
      />
      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">Recent stock transaction history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Before</th>
                <th className="px-4 py-3">After</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{transaction.product.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatStockTransactionType(transaction.type, transaction.note, transaction.referenceNumber)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(transaction.quantity), transaction.product.unit)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(transaction.previousQuantity), transaction.product.unit)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(transaction.newQuantity), transaction.product.unit)}</td>
                  <td className="px-4 py-3 text-slate-600">{transaction.referenceNumber || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(transaction.transactionDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {modal === "stock" ? (
        <ModalShell title="Record stock" description="Add stock in, stock out, or stock adjustment." closeHref="/stock">
          <StockForm
            embedded
            closeHref="/stock"
            products={products.map((product) => ({
              id: product.id,
              name: product.name,
              sku: product.sku,
              quantity: Number(product.quantity),
              unit: product.unit
            }))}
          />
        </ModalShell>
      ) : null}
    </>
  );
}
