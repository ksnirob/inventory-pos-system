import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const appTimeZone = "Asia/Dhaka";

function dateParts(date: Date | string, timeZone = appTimeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(date));

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01"
  };
}

export function formatDateInputValue(date: Date | string = new Date()) {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatCurrency(value: number | string) {
  const amount = new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0
  }).format(Math.round(Number(value)));

  return `৳ ${amount}`;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: appTimeZone,
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export function getStockStatus(quantity: number, minimumStockLevel: number) {
  const currentQuantity = Number(quantity);
  const minimumQuantity = Number(minimumStockLevel);

  if (currentQuantity <= 0) {
    return "OUT_OF_STOCK";
  }

  if (currentQuantity <= minimumQuantity) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}

export function formatStockTransactionType(type: string, note?: string | null, referenceNumber?: string | null) {
  if (type === "STOCK_OUT" && (note === "Order fulfillment" || referenceNumber?.startsWith("ORD-"))) {
    return "Sale";
  }

  if (type === "STOCK_IN") return "Stock In";
  if (type === "STOCK_OUT") return "Stock Out";
  if (type === "ADJUSTMENT") return "Adjustment";

  return type.replace("_", " ");
}

export function formatQuantity(value: number | string, unit?: string) {
  const quantity = Number(value);
  const normalizedUnit = (unit || "").toLowerCase();

  if (normalizedUnit === "kg" || normalizedUnit === "kilogram" || normalizedUnit === "kilograms") {
    if (quantity > 0 && quantity < 1) {
      return `${Number((quantity * 1000).toFixed(2))} gm`;
    }
    return `${Number(quantity.toFixed(3))} kg`;
  }

  if (normalizedUnit === "litre" || normalizedUnit === "liter") {
    if (quantity > 0 && quantity < 1) {
      return `${Number((quantity * 1000).toFixed(2))} ml`;
    }
    return `${Number(quantity.toFixed(3))} litre`;
  }

  return `${Number(quantity.toFixed(3))} ${unit || ""}`.trim();
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}
