import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number | string) {
  const amount = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value));

  return `৳ ${amount}`;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
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
