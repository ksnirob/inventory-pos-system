import { PackageCheck, Plus, ShoppingCart, TrendingUp, Truck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { OrderPipeline } from "@/components/orders/order-pipeline";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "";

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        status ? { status } : {},
        query
          ? {
              OR: [
                { orderNumber: { contains: query } },
                { customer: { name: { contains: query } } },
                { customer: { phone: { contains: query } } }
              ]
            }
          : {}
      ]
    },
    include: {
      customer: true,
      items: true
    },
    orderBy: { orderDate: "desc" }
  });

  const [allOrders, expenses] = await Promise.all([
    prisma.order.findMany({ include: { items: { include: { product: true } } } }),
    prisma.expense.findMany()
  ]);
  const pendingCount = allOrders.filter((order) => order.status === "PENDING").length;
  const shippedCount = allOrders.filter((order) => order.status === "SHIPPED").length;
  const revenue = allOrders.reduce((total, order) => total + Number(order.total), 0);
  const profit = allOrders.reduce((total, order) => {
    const productCost = order.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.purchasePrice), 0);
    return total + Number(order.total) - productCost;
  }, 0) - expenses.reduce((total, expense) => total + Number(expense.amount), 0);

  return (
    <>
      <PageHeader title="Sales History" description="Review POS sales, payments, and order statuses." action={{ href: "/orders/new", label: "Open POS", icon: <Plus size={16} /> }} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total order value" value={formatCurrency(revenue)} icon={ShoppingCart} />
        <StatCard label="Sales profit" value={formatCurrency(profit)} icon={TrendingUp} />
        <StatCard label="Pending orders" value={pendingCount} icon={PackageCheck} />
        <StatCard label="Shipped orders" value={shippedCount} icon={Truck} />
      </div>

      <OrderPipeline
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          status: order.status,
          total: String(order.total)
        }))}
      />

      <form className="mb-5 grid gap-3 rounded-md border border-stone-200 bg-white p-4 lg:grid-cols-[1fr_180px_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search order number, customer, or phone"
          className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
        <select name="status" defaultValue={status} className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="h-11 rounded-md border border-stone-200 bg-stone-900 px-4 text-sm font-semibold text-white" type="submit">Filter</button>
      </form>

      <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-semibold text-stone-950">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-stone-600">
                    <div className="font-medium text-stone-900">{order.customer.name}</div>
                    <div className="text-xs text-stone-500">{order.customer.phone || order.customer.email || "No contact"}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{order.items.length}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-stone-600">{order.paymentMethod.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-semibold text-stone-950">{formatCurrency(String(order.total))}</td>
                  <td className="px-4 py-3 text-stone-600">{formatDate(order.orderDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/orders/${order.id}`} className="font-semibold text-stone-950 hover:text-amber-700">View</Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-stone-500">No sales found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="border-t border-stone-200 px-4 py-3">
          <LinkButton href="/orders/new" className="h-9 px-3">
            <Plus size={15} />
            Open POS
          </LinkButton>
        </div>
      </div>
    </>
  );
}
