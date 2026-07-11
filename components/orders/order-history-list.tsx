"use client";

import { ChevronDown, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { OrderPipeline } from "@/components/orders/order-pipeline";
import { LinkButton } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { formatCurrency, formatDate, formatDateInputValue } from "@/lib/utils";

type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerContact: string;
  itemsCount: number;
  status: string;
  paymentMethod: string;
  total: string;
  orderDate: string;
};

export function OrderHistoryList({ orders }: { orders: OrderHistoryItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("desc");

  const dateMatchedOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!period) return true;

      const orderDateKey = formatDateInputValue(order.orderDate);
      const todayKey = formatDateInputValue();

      if (period === "daily") {
        return orderDateKey === todayKey;
      }

      if (period === "weekly") {
        const start = new Date(`${todayKey}T00:00:00`);
        const day = start.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + mondayOffset);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const date = new Date(`${orderDateKey}T00:00:00`);
        return date >= start && date < end;
      }

      if (period === "monthly") {
        return orderDateKey.slice(0, 7) === todayKey.slice(0, 7);
      }

      if (period === "yearly") {
        return orderDateKey.slice(0, 4) === todayKey.slice(0, 4);
      }

      if (period === "custom") {
        return (!fromDate || orderDateKey >= fromDate) && (!toDate || orderDateKey <= toDate);
      }

      return true;
    });
  }, [fromDate, orders, period, toDate]);

  const searchMatchedOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return dateMatchedOrders.filter((order) => {
      const matchesQuery = normalizedQuery
        ? [order.orderNumber, order.customerName, order.customerContact].some((value) => value.toLowerCase().includes(normalizedQuery))
        : true;

      return matchesQuery;
    });
  }, [dateMatchedOrders, query]);

  const visibleOrders = useMemo(() => {
    return searchMatchedOrders
      .filter((order) => (status ? order.status === status : true))
      .toSorted((first, second) => {
        const firstTime = new Date(first.orderDate).getTime();
        const secondTime = new Date(second.orderDate).getTime();
        return sort === "asc" ? firstTime - secondTime : secondTime - firstTime;
      });
  }, [searchMatchedOrders, sort, status]);

  return (
    <>
      <div className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03] xl:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(170px,210px))]">
        <label className="relative">
          <span className="sr-only">Search orders</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={17} />
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order number, customer, or phone"
            autoComplete="off"
            className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Filter by status</span>
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
        </label>
        <label className="relative">
          <span className="sr-only">Filter by date period</span>
          <select
            name="period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-11 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All dates</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom range</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
        </label>
        <label className="relative">
          <span className="sr-only">Sort by date</span>
          <select
            name="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-11 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
        </label>
        {period === "custom" ? (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              aria-label="From date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              aria-label="To date"
            />
          </>
        ) : null}
      </div>

      <OrderPipeline
        orders={dateMatchedOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          total: order.total
        }))}
        activeStatus={status}
        onStatusChange={setStatus}
      />

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
              {visibleOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-semibold text-stone-950">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-stone-600">
                    <div className="font-medium text-stone-900">{order.customerName}</div>
                    <div className="text-xs text-stone-500">{order.customerContact || "No contact"}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{order.itemsCount}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-stone-600">{order.paymentMethod.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-semibold text-stone-950">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3 text-stone-600">{formatDate(order.orderDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/orders/${order.id}`} className="font-semibold text-emerald-700 hover:text-emerald-900">View</Link>
                  </td>
                </tr>
              ))}
              {visibleOrders.length === 0 ? (
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
