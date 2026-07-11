import { Plus, ShoppingCart, TrendingUp, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { OrderHistoryList } from "@/components/orders/order-history-list";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      items: { include: { product: true } }
    },
    orderBy: { orderDate: "desc" }
  });

  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const revenue = orders.reduce((total, order) => total + Number(order.total), 0);
  const deliveryCharge = deliveredOrders.reduce((total, order) => total + Number(order.deliveryCharge), 0);
  const profit = deliveredOrders.reduce((total, order) => {
    const productCost = order.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.purchasePrice), 0);
    const productSales = Number(order.subtotal) - Number(order.discount);
    return total + productSales - productCost;
  }, 0);

  return (
    <>
      <PageHeader title="Sales History" description="Review POS sales, payments, and order statuses." action={{ href: "/orders/new", label: "Open POS", icon: <Plus size={16} /> }} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total order value" value={formatCurrency(revenue)} icon={ShoppingCart} />
        <StatCard label="Product profit" value={formatCurrency(profit)} icon={TrendingUp} />
        <StatCard label="Delivered charge" value={formatCurrency(deliveryCharge)} icon={Truck} />
      </div>

      <OrderHistoryList
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          customerContact: order.customer.phone || order.customer.email || "",
          itemsCount: order.items.length,
          status: order.status,
          paymentMethod: order.paymentMethod,
          total: String(order.total),
          orderDate: order.orderDate.toISOString()
        }))}
      />
    </>
  );
}
