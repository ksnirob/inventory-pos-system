"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { formatCurrency } from "@/lib/utils";
import { orderStatusLabels, orderStatuses, type OrderStatus } from "@/types/inventory";

type PipelineOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: string;
};

export function OrderPipeline({ orders }: { orders: PipelineOrder[] }) {
  const [activeStatus, setActiveStatus] = useState<OrderStatus | "ALL">("ALL");
  const visibleOrders = activeStatus === "ALL" ? orders : orders.filter((order) => order.status === activeStatus);

  const totals = useMemo(() => {
    return orderStatuses.reduce<Record<OrderStatus, { count: number; value: number }>>(
      (summary, status) => {
        const matching = orders.filter((order) => order.status === status);
        summary[status] = {
          count: matching.length,
          value: matching.reduce((total, order) => total + Number(order.total), 0)
        };
        return summary;
      },
      {
        PENDING: { count: 0, value: 0 },
        CONFIRMED: { count: 0, value: 0 },
        SHIPPED: { count: 0, value: 0 },
        DELIVERED: { count: 0, value: 0 },
        CANCELLED: { count: 0, value: 0 }
      }
    );
  }, [orders]);

  return (
    <section className="mb-6 rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-stone-950">Order pipeline</h2>
          <p className="text-sm text-stone-500">Click a status to preview matching orders.</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveStatus("ALL")}
          className="h-9 rounded-md border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
        >
          Show all
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {orderStatuses.map((status) => {
          const active = activeStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`rounded-md border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-950"
              }`}
            >
              <span className={active ? "text-sm font-semibold text-white" : "text-sm font-semibold text-stone-700"}>{orderStatusLabels[status]}</span>
              <span className="mt-3 block text-2xl font-bold">{totals[status].count}</span>
              <span className={active ? "text-xs text-stone-200" : "text-xs text-stone-500"}>{formatCurrency(totals[status].value)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {visibleOrders.slice(0, 4).map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="rounded-md border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-stone-950">{order.orderNumber}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="truncate text-sm text-stone-500">{order.customerName}</p>
            <p className="mt-2 font-semibold text-stone-950">{formatCurrency(order.total)}</p>
          </Link>
        ))}
        {visibleOrders.length === 0 ? <p className="text-sm text-stone-500">No orders in this status.</p> : null}
      </div>
    </section>
  );
}
