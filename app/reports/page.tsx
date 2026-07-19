import { AlertTriangle, Download, PackageCheck, TrendingUp, Truck, Wallet } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StockBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/utils";
import { stockTransactionTypes, type StockTransactionType } from "@/types/inventory";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function dateRange(period: string, from: string, to: string) {
  const today = startOfDay(new Date());

  if (period === "today") {
    return { gte: today, lt: addDays(today, 1) };
  }

  if (period === "week") {
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = addDays(today, mondayOffset);
    return { gte: weekStart, lt: addDays(weekStart, 7) };
  }

  if (period === "month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return { gte: monthStart, lt: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
  }

  return {
    gte: from ? startOfDay(new Date(from)) : undefined,
    lt: to ? addDays(startOfDay(new Date(to)), 1) : undefined
  };
}

function unitValue(totalValue: unknown, baseQuantity: unknown) {
  const quantity = Number(baseQuantity);
  if (quantity <= 0) return Number(totalValue);
  return Number(totalValue) / quantity;
}

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
  const period = typeof resolvedSearchParams.period === "string" ? resolvedSearchParams.period : "";
  const sort = resolvedSearchParams.sort === "asc" ? "asc" : "desc";
  const activeDateRange = dateRange(period, from, to);
  const dateWhere = activeDateRange.gte || activeDateRange.lt
    ? {
        gte: activeDateRange.gte,
        lt: activeDateRange.lt
      }
    : undefined;

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
          gte: activeDateRange.gte,
          lt: activeDateRange.lt
        }
      },
      include: { product: true },
      orderBy: { transactionDate: sort }
    }),
    prisma.order.findMany({
      where: {
        orderDate: dateWhere
      },
      include: { items: { include: { product: true } } },
      orderBy: { orderDate: sort }
    }),
    prisma.expense.findMany({
      where: {
        expenseDate: dateWhere
      }
    })
  ]);

  const reportProducts = products.filter((product) => {
    const matchesProduct = !productId || product.id === productId;
    const matchesQuery = !query || `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase());
    return matchesProduct && matchesQuery;
  });
  const lowStock = reportProducts.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= Number(product.minimumStockLevel));
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const productSales = deliveredOrders.reduce((total, order) => total + Number(order.subtotal) - Number(order.discount), 0);
  const deliveryCollected = deliveredOrders.reduce((total, order) => total + Number(order.deliveryCharge), 0);
  const productCost = deliveredOrders.reduce((total, order) => {
    return total + order.items.reduce((sum, item) => sum + Number(item.quantity) * unitValue(item.product.purchasePrice, item.product.baseQuantity), 0);
  }, 0);
  const grossProfit = productSales - productCost;
  const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const netProfit = grossProfit - totalExpenses;
  const totalProductPurchasePrice = reportProducts.reduce((total, product) => total + Number(product.purchasePrice), 0);
  const inventoryCost = reportProducts.reduce((total, product) => total + unitValue(product.purchasePrice, product.baseQuantity) * Number(product.quantity), 0);
  const inventorySellingValue = reportProducts.reduce((total, product) => total + unitValue(product.sellingPrice, product.baseQuantity) * Number(product.quantity), 0);
  const stockPotentialProfit = inventorySellingValue - inventoryCost;
  const deliveredCount = deliveredOrders.length;
  const stockAlerts = lowStock.length + reportProducts.filter((product) => Number(product.quantity) <= 0).length;
  const exportParams = new URLSearchParams();
  if (query) exportParams.set("q", query);
  if (productId) exportParams.set("product", productId);
  if (type) exportParams.set("type", type);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  if (period) exportParams.set("period", period);
  if (sort) exportParams.set("sort", sort);

  return (
    <>
      <PageHeader title="Reports" description="Inventory value, stock alerts, and transaction history." />
      <div className="mb-5">
        <FilterBar
          search={query}
          product={productId}
          type={type}
          from={from}
          to={to}
          period={period}
          sort={sort}
          products={products.map((product) => ({ value: product.id, label: product.name }))}
          showTransactionType
          resetHref="/reports"
        >
          <LinkButton href={`/api/reports/export?${exportParams.toString()}`} variant="secondary">
            <Download size={16} />
            Export CSV
          </LinkButton>
        </FilterBar>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={reportProducts.length} icon={PackageCheck} />
        <StatCard label="Total product purchase price" value={formatCurrency(totalProductPurchasePrice)} icon={Wallet} tooltip="Sum of product base purchase prices" />
        <StatCard label="Delivered orders" value={deliveredCount} icon={PackageCheck} />
        <StatCard label="Stock warning" value={stockAlerts} icon={AlertTriangle} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Product sales" value={formatCurrency(productSales)} icon={Wallet} tooltip="Delivered product total - discount" />
        <StatCard label="Delivered charge" value={formatCurrency(deliveryCollected)} icon={Truck} />
        <StatCard label="Product cost" value={formatCurrency(productCost)} icon={Wallet} tooltip="Sold quantity x purchase price" />
        <StatCard label="Product profit" value={formatCurrency(grossProfit)} icon={TrendingUp} tooltip="Product sales - product cost" />
        <StatCard label="Net profit" value={formatCurrency(netProfit)} icon={TrendingUp} tooltip="Product profit - expense" />
        <StatCard label="Stock potential profit" value={formatCurrency(stockPotentialProfit)} icon={TrendingUp} tooltip="Stock selling value - stock cost" />
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
                <th className="px-4 py-3">Current quantity</th>
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
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(product.baseQuantity), product.unit)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(product.quantity), product.unit)}</td>
                  <td className="px-4 py-3">
                    <StockBadge quantity={Number(product.quantity)} minimumStockLevel={Number(product.minimumStockLevel)} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(unitValue(product.purchasePrice, product.baseQuantity) * Number(product.quantity))}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(unitValue(product.sellingPrice, product.baseQuantity) * Number(product.quantity))}</td>
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
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(transaction.quantity), transaction.product.unit)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(transaction.previousQuantity), transaction.product.unit)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(Number(transaction.newQuantity), transaction.product.unit)}</td>
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
