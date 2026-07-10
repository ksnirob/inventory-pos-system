import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStockStatus } from "@/lib/utils";
import { stockTransactionTypes, type StockTransactionType } from "@/types/inventory";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
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
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined
        }
      },
      include: { product: true },
      orderBy: { transactionDate: "desc" }
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
      Number(product.quantity),
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
      Number(transaction.quantity),
      Number(transaction.previousQuantity),
      Number(transaction.newQuantity),
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
