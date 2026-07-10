export type ActionState = {
  ok: boolean;
  message: string;
  orderId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type StockTransactionType = "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "MOBILE_BANKING" | "BANK_TRANSFER";

export const stockTransactionTypes = ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"] as const;
export const orderStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const paymentMethods = ["CASH", "CARD", "MOBILE_BANKING", "BANK_TRANSFER"] as const;

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_BANKING: "Mobile banking",
  BANK_TRANSFER: "Bank transfer"
};

export const stockStatusLabels: Record<StockStatus, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock"
};
