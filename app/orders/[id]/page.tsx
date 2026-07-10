import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/forms/order-status-form";
import { PrintButton } from "@/components/orders/print-button";
import { PageHeader } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/utils";

function formatReceiptDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={order.orderNumber} description={`Created ${formatDate(order.orderDate)}`} action={{ href: "/orders/new", label: "New sale" }} />
      </div>
      <section className="mb-6 grid justify-center print:block">
        <div className="mb-4 flex justify-center print:hidden">
          <PrintButton />
        </div>
        <div className="pos-slip w-[320px] rounded-sm border border-stone-300 bg-white px-4 py-5 font-mono text-[12px] leading-tight text-stone-950 shadow-sm print:mx-auto print:w-[80mm] print:border-0 print:p-0 print:shadow-none">
          <div className="text-center">
            <p className="text-[18px] font-black uppercase tracking-wide">OrderDesk POS</p>
            <p className="mt-1 text-[11px] uppercase">Inventory Management System</p>
            <p className="text-[11px]">Sales Payslip</p>
          </div>

          <div className="my-3 border-y border-dashed border-stone-400 py-2">
            <div className="flex justify-between gap-3">
              <span>Slip No</span>
              <span className="text-right font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Date</span>
              <span className="text-right">{formatReceiptDate(order.orderDate)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Cashier</span>
              <span className="text-right">Admin</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Customer</span>
              <span className="text-right">{order.customer.name}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="grid grid-cols-[1fr_72px] border-b border-dashed border-stone-400 pb-1 text-[11px] font-bold uppercase">
              <span>Item</span>
              <span className="text-right">Amount</span>
            </div>
            {order.items.map((item) => {
              const saleQuantity = item.enteredQuantity && item.enteredUnit
                ? `${Number(item.enteredQuantity)} ${item.enteredUnit}`
                : formatQuantity(String(item.quantity), item.product.unit);

              return (
                <div key={item.id} className="border-b border-dashed border-stone-200 pb-2">
                  <div className="grid grid-cols-[1fr_72px] gap-2">
                    <span className="break-words font-bold uppercase">{item.product.name}</span>
                    <span className="text-right font-bold">{formatCurrency(String(item.lineTotal))}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-3 text-[11px] text-stone-600">
                    <span>{saleQuantity} x {formatCurrency(String(item.unitPrice))}</span>
                    <span>{item.product.sku}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-y border-dashed border-stone-400 py-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(String(order.subtotal))}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(String(order.tax))}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(String(order.discount))}</span></div>
            <div className="mt-2 flex justify-between border-t border-dashed border-stone-400 pt-2 text-[15px] font-black">
              <span>TOTAL</span>
              <span>{formatCurrency(String(order.total))}</span>
            </div>
          </div>

          <div className="mt-2 grid gap-1">
            <div className="flex justify-between"><span>Payment</span><span>{order.paymentMethod.replace("_", " ")}</span></div>
            <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(String(order.paidAmount))}</span></div>
            <div className="flex justify-between text-[14px] font-black"><span>Change</span><span>{formatCurrency(String(order.changeDue))}</span></div>
            <div className="flex justify-between"><span>Status</span><span>{order.status}</span></div>
          </div>

          <div className="mt-4 border-t border-dashed border-stone-400 pt-3 text-center text-[11px]">
            <p className="font-bold uppercase">Thank you for shopping</p>
            <p>Goods sold are not returnable</p>
            <p className="mt-2">Powered by OrderDesk POS</p>
          </div>
        </div>
      </section>
      <div className="grid gap-6 print:hidden xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-stone-950">Order items</h2>
              <p className="text-sm text-stone-500">{order.items.length} products in this order</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit price</th>
                  <th className="px-4 py-3">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-stone-950">{item.product.name}</td>
                    <td className="px-4 py-3 text-stone-600">{item.product.sku}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.enteredQuantity && item.enteredUnit
                        ? `${Number(item.enteredQuantity)} ${item.enteredUnit}`
                        : formatQuantity(String(item.quantity), item.product.unit)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{formatCurrency(String(item.unitPrice))}</td>
                    <td className="px-4 py-3 font-semibold text-stone-950">{formatCurrency(String(item.lineTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-stone-950">Customer</h2>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-stone-500">Name</dt>
                <dd className="font-semibold text-stone-950">{order.customer.name}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Contact</dt>
                <dd className="font-semibold text-stone-950">{order.customer.phone || order.customer.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Address</dt>
                <dd className="font-semibold text-stone-950">{order.customer.address || "-"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-stone-950">Totals</h2>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd className="font-semibold">{formatCurrency(String(order.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Tax</dt><dd className="font-semibold">{formatCurrency(String(order.tax))}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Discount</dt><dd className="font-semibold">-{formatCurrency(String(order.discount))}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold">{formatCurrency(String(order.total))}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Paid</dt><dd className="font-semibold">{formatCurrency(String(order.paidAmount))}</dd></div>
              <div className="flex justify-between text-emerald-700"><dt className="font-semibold">Change</dt><dd className="font-bold">{formatCurrency(String(order.changeDue))}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Payment</dt><dd className="font-semibold">{order.paymentMethod.replace("_", " ")}</dd></div>
            </dl>
          </section>

          <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <OrderStatusForm orderId={order.id} status={order.status} />
          </section>
        </aside>
      </div>
      <div className="mt-6 print:hidden">
        <LinkButton href="/orders" variant="secondary">Back to sales history</LinkButton>
      </div>
    </>
  );
}
