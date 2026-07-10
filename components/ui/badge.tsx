import { getStockStatus, cn } from "@/lib/utils";
import { stockStatusLabels, type StockStatus } from "@/types/inventory";

const stockClasses: Record<StockStatus, string> = {
  IN_STOCK: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LOW_STOCK: "bg-amber-50 text-amber-700 ring-amber-200",
  OUT_OF_STOCK: "bg-red-50 text-red-700 ring-red-200"
};

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", className)}>
      {children}
    </span>
  );
}

export function StockBadge({
  quantity,
  minimumStockLevel
}: {
  quantity: number;
  minimumStockLevel: number;
}) {
  const status = getStockStatus(Number(quantity), Number(minimumStockLevel));
  return <Badge className={stockClasses[status]}>{stockStatusLabels[status]}</Badge>;
}
