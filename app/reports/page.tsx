import { Download, PackageCheck, TrendingUp, Wallet } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StockBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { stockTransactionTypes, type StockTransactionType } from "@/types/inventory";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const productId = typeof resolvedSearchParams.product === "string" ? resolvedSearchParams.product : "";
  const type =
    typeof resolvedSearchParams.type === "string" &&
    stockTransactionTypes.includes(resolvedSearchParams.type as StockTransactionType)
      ? (resolvedSearchParams.type as StockTransactionType)
      : "";
  const from = typeof resolvedSearchParams.from === "string" ? resolvedSearchParams.from : "";
  const to = typeof resolvedSearchParams.to === "string" ? resolvedSearchParams.to : "";

  const [products, transactions, orders, expenses] = await Promise.all([
    prisma.product.findMany({ include: { category: true, supplier: true }, orderBy: { name: "asc" } }),
    prisma.stockTransaction.findMany({
      where: {
        productId: productId || undefined,
        type: type || undefined,
        product: query
          ? {
              is: {
                OR: [
                  { name: { contains: query } },
                  { sku: { contains: query } }
                ]
              }
            }
          : undefined,
        transactionDate: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined
        }
      },
      include: { product: true },
      orderBy: { transactionDate: "desc" }
    }),
    prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { orderDate: "desc" }
    }),
    prisma.expense.findMany()
  ]);

  const reportProducts = products.filter((product) => {
    const matchesProduct = !productId || product.id === productId;
    const matchesQuery = !query || `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase());
    return matchesProduct && matchesQuery;
  });
  const lowStock = reportProducts.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= Number(product.minimumStockLevel));
  const outOfStock = reportProducts.filter((product) => Number(product.quantity) <= 0);
  const purchaseValue = reportProducts.reduce((total, product) => total + Number(product.purchasePrice) * Number(product.quantity), 0);
  const sellingValue = reportProducts.reduce((total, product) => total + Number(product.sellingPrice) * Number(product.quantity), 0);
  const potentialProfit = sellingValue - purchaseValue;
  const salesRevenue = orders.reduce((total, order) => total + Number(order.total), 0);
  const salesProfit = orders.reduce((total, order) => {
    const productCost = order.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.purchasePrice), 0);
    return total + Number(order.total) - productCost;
  }, 0);
  const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const netProfit = salesProfit - totalExpenses;
  const exportParams = new URLSearchParams();
  if (query) exportParams.set("q", query);
  if (productId) exportParams.set("product", productId);
  if (type) exportParams.set("type", type);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <>
      <PageHeader title="Reports" description="Inventory value, stock alerts, and transaction history." />
      <FilterBar
        search={query}
        product={productId}
        type={type}
        from={from}
        to={to}
        products={products.map((product) => ({ value: product.id, label: product.name }))}
        showTransactionType
        resetHref="/reports"
      />
      <div className="mb-5 flex justify-end">
        <LinkButton href={`/api/reports/export?${exportParams.toString()}`} variant="secondary">
          <Download size={16} />
          Export CSV
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current inventory items" value={reportProducts.length} icon={PackageCheck} />
        <StatCard label="Low-stock report" value={lowStock.length} icon={PackageCheck} />
        <StatCard label="Out-of-stock report" value={outOfStock.length} icon={PackageCheck} />
        <StatCard label="Transactions shown" value={transactions.length} icon={Download} />
        <StatCard label="Total purchase value" value={formatCurrency(purchaseValue)} icon={Wallet} />
        <StatCard label="Potential selling value" value={formatCurrency(sellingValue)} icon={Wallet} />
        <StatCard label="Potential profit" value={formatCurrency(potentialProfit)} icon={TrendingUp} />
        <StatCard label="POS gross profit" value={formatCurrency(salesProfit)} icon={TrendingUp} />
        <StatCard label="Expenses" value={formatCurrency(totalExpenses)} icon={Wallet} />
        <StatCard label="Net profit" value={formatCurrency(netProfit)} icon={TrendingUp} />
        <StatCard label="POS sales revenue" value={formatCurrency(salesRevenue)} icon={Wallet} />
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
              {reportProducts.map((product) => (
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
