import Link from "next/link";
import { AlertTriangle, Boxes, FolderTree, Package, PackageX, ShoppingCart, TrendingUp, Truck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StockBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/utils";

function unitValue(totalValue: unknown, baseQuantity: unknown) {
  const quantity = Number(baseQuantity);
  if (quantity <= 0) return Number(totalValue);
  return Number(totalValue) / quantity;
}

export default async function DashboardPage() {
  const [products, categoryCount, supplierCount, recentProducts, recentOrders, orders, orderCount, totalSales, expenses] = await Promise.all([
    prisma.product.findMany({ include: { category: true, supplier: true }, orderBy: { name: "asc" } }),
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.order.findMany({ include: { customer: true, items: { include: { product: true } } }, orderBy: { orderDate: "desc" }, take: 6 }),
    prisma.order.findMany({ include: { items: { include: { product: true } } } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.expense.findMany()
  ]);

  const totalStock = products.reduce((total, product) => total + Number(product.quantity), 0);
  const totalProductPurchasePrice = products.reduce((total, product) => total + unitValue(product.purchasePrice, product.baseQuantity) * Number(product.quantity), 0);
  const lowStockProducts = products.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= Number(product.minimumStockLevel));
  const outOfStockProducts = products.filter((product) => Number(product.quantity) <= 0);
  const totalSalesValue = Number(totalSales._sum.total ?? 0);
  const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const netProfit = deliveredOrders.reduce((total, order) => {
    const productCost = order.items.reduce((sum, item) => sum + Number(item.quantity) * unitValue(item.product.purchasePrice, item.product.baseQuantity), 0);
    const productSales = Number(order.subtotal) - Number(order.discount);
    return total + productSales - productCost;
  }, 0) - totalExpenses;

  const pulse = [
    { label: "Available stock", value: totalStock, icon: Boxes, color: "bg-sky-50 text-sky-700" },
    { label: "Categories", value: categoryCount, icon: FolderTree, color: "bg-amber-50 text-amber-700" },
    { label: "Suppliers", value: supplierCount, icon: Truck, color: "bg-orange-50 text-[#e45232]" },
    { label: "Low stock", value: lowStockProducts.length, icon: AlertTriangle, color: "bg-yellow-50 text-yellow-700" },
    { label: "Out of stock", value: outOfStockProducts.length, icon: PackageX, color: "bg-rose-50 text-rose-700" }
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="A clear view of sales, stock, and today's retail activity." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Products" value={products.length} icon={Package} />
        <StatCard label="Total product purchase price" value={formatCurrency(totalProductPurchasePrice)} icon={Wallet} tooltip="Current quantity x purchase price" />
        <StatCard label="Sales orders" value={orderCount} icon={ShoppingCart} />
        <StatCard label="Total sales" value={formatCurrency(totalSalesValue)} icon={Boxes} />
        <StatCard label="Net profit" value={formatCurrency(netProfit)} icon={TrendingUp} tooltip="Product profit - expense" />
      </div>

      <section className="mt-5 rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {pulse.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-md p-3 transition hover:bg-slate-50">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${item.color}`}>
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-lg font-bold text-slate-950">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <DashboardList title="Recent sales" href="/orders" linkLabel="View sales">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="truncate text-xs text-slate-500">{order.customer.name} - {order.items.length} items</p>
              </div>
              <p className="shrink-0 font-bold text-slate-950">{formatCurrency(String(order.total))}</p>
            </div>
          ))}
          {recentOrders.length === 0 ? <EmptyRow text="No sales yet" /> : null}
        </DashboardList>

        <DashboardList title="New products" href="/products" linkLabel="View products">
          {recentProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{product.name}</p>
                <p className="truncate text-xs text-slate-500">{product.category.name} - {formatDate(product.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right">
                <span className="font-bold text-slate-950">{formatQuantity(String(product.quantity), product.unit)}</span>
                <StockBadge quantity={Number(product.quantity)} minimumStockLevel={Number(product.minimumStockLevel)} />
              </div>
            </div>
          ))}
          {recentProducts.length === 0 ? <EmptyRow text="No products yet" /> : null}
        </DashboardList>
      </div>
    </>
  );
}

function DashboardList({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="font-bold text-slate-950">{title}</h2>
        <Link href={href} className="text-xs font-bold text-emerald-700 hover:text-emerald-900">{linkLabel}</Link>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-400">{text}</p>;
}
