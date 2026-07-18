import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatQuantity, getStockStatus } from "@/lib/utils";
import { stockTransactionTypes, type StockTransactionType } from "@/types/inventory";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function dateRange(period: string | null, from: string | null, to: string | null) {
  const today = startOfDay(new Date());

  if (period === "today") {
    return { gte: today, lt: addDays(today, 1) };
  }

  if (period === "week") {
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = addDays(today, mondayOffset);
    return { gte: weekStart, lt: addDays(weekStart, 7) };
  }

  if (period === "month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return { gte: monthStart, lt: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
  }

  return {
    gte: from ? startOfDay(new Date(from)) : undefined,
    lt: to ? addDays(startOfDay(new Date(to)), 1) : undefined
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const productId = searchParams.get("product") || undefined;
  const typeValue = searchParams.get("type");
  const type =
    typeValue && stockTransactionTypes.includes(typeValue as StockTransactionType)
      ? (typeValue as StockTransactionType)
      : undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const period = searchParams.get("period");
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const activeDateRange = dateRange(period, from, to);

  const [products, transactions] = await Promise.all([
    prisma.product.findMany({
      where: {
        id: productId,
        OR: query
          ? [
              { name: { contains: query } },
              { sku: { contains: query } }
            ]
          : undefined
      },
      include: { category: true, supplier: true },
      orderBy: { name: "asc" }
    }),
    prisma.stockTransaction.findMany({
      where: {
        productId,
        type,
        product: query
          ? {
              is: {
                OR: [
                  { name: { contains: query } },
                  { sku: { contains: query } }
                ]
              }
            }
          : undefined,
        transactionDate: {
          gte: activeDateRange.gte,
          lt: activeDateRange.lt
        }
      },
      include: { product: true },
      orderBy: { transactionDate: sort }
    })
  ]);

  const inventoryRows = [
    ["Report", "Product", "SKU", "Category", "Supplier", "Quantity", "Status", "Purchase Value", "Selling Value", "Potential Profit"],
    ...products.map((product) => [
      "Current Inventory",
      product.name,
      product.sku,
      product.category.name,
      product.supplier.name,
      formatQuantity(Number(product.quantity), product.unit),
      getStockStatus(Number(product.quantity), Number(product.minimumStockLevel)),
      Number(product.purchasePrice) * Number(product.quantity),
      Number(product.sellingPrice) * Number(product.quantity),
      (Number(product.sellingPrice) - Number(product.purchasePrice)) * Number(product.quantity)
    ])
  ];

  const transactionRows = [
    ["Report", "Product", "Type", "Quantity", "Before", "After", "Reference", "Date"],
    ...transactions.map((transaction) => [
      "Stock Transactions",
      transaction.product.name,
      transaction.type,
      formatQuantity(Number(transaction.quantity), transaction.product.unit),
      formatQuantity(Number(transaction.previousQuantity), transaction.product.unit),
      formatQuantity(Number(transaction.newQuantity), transaction.product.unit),
      transaction.referenceNumber || "",
      transaction.transactionDate.toISOString().slice(0, 10)
    ])
  ];

  const csv = [...inventoryRows, [], ...transactionRows]
    .map((row) => row.map((cell) => csvCell(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=inventory-report.csv"
    }
  });
}
