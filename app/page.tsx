import { AlertTriangle, Boxes, DollarSign, FolderTree, Package, PackageX, ShoppingCart, TrendingUp, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StockBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const [products, categoryCount, supplierCount, recentTransactions, recentProducts, recentOrders, orderCount, expenses] = await Promise.all([
    prisma.product.findMany({ include: { category: true, supplier: true }, orderBy: { name: "asc" } }),
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.stockTransaction.findMany({
      include: { product: true },
      orderBy: { transactionDate: "desc" },
      take: 6
    }),
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.order.findMany({
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { orderDate: "desc" },
      take: 6
    }),
    prisma.order.count(),
    prisma.expense.findMany({ orderBy: { expenseDate: "desc" }, take: 30 })
  ]);

  const totalStock = products.reduce((total, product) => total + Number(product.quantity), 0);
  const lowStockProducts = products.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= Number(product.minimumStockLevel));
  const outOfStockProducts = products.filter((product) => Number(product.quantity) <= 0);
  const inventoryValue = products.reduce((total, product) => total + Number(product.purchasePrice) * Number(product.quantity), 0);
  const recentExpense = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const recentProfit = recentOrders.reduce((total, order) => {
    const productCost = order.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.purchasePrice), 0);
    return total + Number(order.total) - productCost;
  }, 0) - recentExpense;

  return (
    <>
      <PageHeader title="Dashboard" description="Live inventory totals, recent products, and stock alerts." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={products.length} icon={Package} />
        <StatCard label="Total orders" value={orderCount} icon={ShoppingCart} />
        <StatCard label="Total categories" value={categoryCount} icon={FolderTree} />
        <StatCard label="Total suppliers" value={supplierCount} icon={Truck} />
        <StatCard label="Total available stock" value={totalStock} icon={Boxes} />
        <StatCard label="Low-stock products" value={lowStockProducts.length} icon={AlertTriangle} />
        <StatCard label="Out-of-stock products" value={outOfStockProducts.length} icon={PackageX} />
        <StatCard label="Total inventory value" value={formatCurrency(inventoryValue)} icon={DollarSign} />
        <StatCard label="Recent profit" value={formatCurrency(recentProfit)} icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-md border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="font-semibold text-stone-950">Recent orders</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-stone-900">{order.orderNumber}</p>
                  <p className="text-sm text-stone-500">{order.customer.name} - {order.items.length} items</p>
                </div>
                <p className="font-semibold text-stone-950">{formatCurrency(String(order.total))}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="font-semibold text-stone-950">Recently added products</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {recentProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-stone-900">{product.name}</p>
                  <p className="text-sm text-stone-500">{product.category.name} - {formatDate(product.createdAt)}</p>
                </div>
                <StockBadge quantity={Number(product.quantity)} minimumStockLevel={Number(product.minimumStockLevel)} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="font-semibold text-stone-950">Recent stock transactions</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-stone-900">{transaction.product.name}</p>
                  <span className="text-sm font-semibold text-stone-700">{Number(transaction.quantity)}</span>
                </div>
                <p className="text-sm text-stone-500">{transaction.type.replace("_", " ")} - {formatDate(transaction.transactionDate)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
