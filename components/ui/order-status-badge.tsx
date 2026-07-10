import { Badge } from "@/components/ui/badge";
import { orderStatusLabels, type OrderStatus } from "@/types/inventory";

const statusClasses: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-200",
  SHIPPED: "bg-violet-50 text-violet-700 ring-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200"
};

export function OrderStatusBadge({ status }: { status: string }) {
  const safeStatus = status as OrderStatus;
  return <Badge className={statusClasses[safeStatus] ?? statusClasses.PENDING}>{orderStatusLabels[safeStatus] ?? status}</Badge>;
}
