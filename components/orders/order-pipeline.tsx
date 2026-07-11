"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { orderStatusLabels, orderStatuses, type OrderStatus } from "@/types/inventory";

type PipelineOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: string;
};

export function OrderPipeline({
  orders,
  activeStatus,
  onStatusChange
}: {
  orders: PipelineOrder[];
  activeStatus: string;
  onStatusChange: (status: string) => void;
}) {
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
          <p className="text-sm text-stone-500">Click a status to filter the sales list below.</p>
        </div>
        <button
          type="button"
          onClick={() => onStatusChange("")}
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
              onClick={() => onStatusChange(status)}
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
    </section>
  );
}
