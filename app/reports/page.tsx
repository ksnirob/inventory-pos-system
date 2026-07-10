import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StockBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { stockTransactionTypes, type StockTransactionType } from "@/types/inventory";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const productId = typeof resolvedSearchParams.product === "string" ? resolvedSearchParams.product : "";
  const type =
    typeof resolvedSearchParams.type === "string" &&
    stockTransactionTypes.includes(resolvedSearchParams.type as StockTransactionType)
      ? (resolvedSearchParams.type as StockTransactionType)
      : "";
  const from = typeof resolvedSearchParams.from === "string" ? resolvedSearchParams.from : "";
  const to = typeof resolvedSearchParams.to === "string" ? resolvedSearchParams.to : "";

  const [products, transactions] = await Promise.all([
    prisma.product.findMany({ include: { category: true, supplier: true }, orderBy: { name: "asc" } }),
    prisma.stockTransaction.findMany({
      where: {
        productId: productId || undefined,
        type: type || undefined,
        transactionDate: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined
        }
      },
      include: { product: true },
      orderBy: { transactionDate: "desc" }
    })
  ]);

  const lowStock = products.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= Number(product.minimumStockLevel));
  const outOfStock = products.filter((product) => Number(product.quantity) <= 0);
  const purchaseValue = products.reduce((total, product) => total + Number(product.purchasePrice) * Number(product.quantity), 0);
  const sellingValue = products.reduce((total, product) => total + Number(product.sellingPrice) * Number(product.quantity), 0);
  const exportParams = new URLSearchParams();
  if (productId) exportParams.set("product", productId);
  if (type) exportParams.set("type", type);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <>
      <PageHeader title="Reports" description="Inventory value, stock alerts, and transaction history." />
      <form className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_180px_160px_160px_auto_auto]">
          <select name="product" defaultValue={productId} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="">All products</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <select name="type" defaultValue={type} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="">All transaction types</option>
            <option value="STOCK_IN">Stock In</option>
            <option value="STOCK_OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
          <input type="date" name="from" defaultValue={from} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" aria-label="From date" />
          <input type="date" name="to" defaultValue={to} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" aria-label="To date" />
          <Button type="submit" variant="secondary">Apply</Button>
          <LinkButton href={`/api/reports/export?${exportParams.toString()}`} variant="secondary">
            <Download size={16} />
            Export CSV
          </LinkButton>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current inventory items" value={products.length} icon={Download} />
        <StatCard label="Low-stock report" value={lowStock.length} icon={Download} />
        <StatCard label="Out-of-stock report" value={outOfStock.length} icon={Download} />
        <StatCard label="Transactions shown" value={transactions.length} icon={Download} />
        <StatCard label="Total purchase value" value={formatCurrency(purchaseValue)} icon={Download} />
        <StatCard label="Potential selling value" value={formatCurrency(sellingValue)} icon={Download} />
      </div>

      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">Current inventory report</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Purchase value</th>
                <th className="px-4 py-3">Selling value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                  <td className="px-4 py-3 text-slate-600">{product.category.name}</td>
                  <td className="px-4 py-3 text-slate-600">{product.supplier.name}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(product.quantity)}</td>
                  <td className="px-4 py-3">
                    <StockBadge quantity={Number(product.quantity)} minimumStockLevel={Number(product.minimumStockLevel)} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(product.purchasePrice) * Number(product.quantity))}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(product.sellingPrice) * Number(product.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-950">Stock transaction history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Before</th>
                <th className="px-4 py-3">After</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{transaction.product.name}</td>
                  <td className="px-4 py-3 text-slate-600">{transaction.type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(transaction.quantity)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(transaction.previousQuantity)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(transaction.newQuantity)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(transaction.transactionDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
