import { z } from "zod";
import { orderStatuses, paymentMethods, stockTransactionTypes } from "@/types/inventory";

const requiredText = z.string().trim().min(1, "This field is required");
const optionalText = z.string().trim().optional().or(z.literal(""));

export const categorySchema = z.object({
  name: requiredText.max(80, "Name must be 80 characters or fewer"),
  description: optionalText
});

export const supplierSchema = z.object({
  name: requiredText.max(100, "Name must be 100 characters or fewer"),
  contactPerson: optionalText,
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: optionalText,
  address: optionalText
});

export const productSchema = z.object({
  name: requiredText.max(120, "Name must be 120 characters or fewer"),
  sku: requiredText.max(60, "SKU must be 60 characters or fewer"),
  description: optionalText,
  categoryId: requiredText,
  supplierId: requiredText,
  purchasePrice: z.coerce.number().min(0, "Purchase price cannot be negative"),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  minimumStockLevel: z.coerce.number().min(0, "Minimum stock cannot be negative"),
  unit: requiredText.max(30, "Unit must be 30 characters or fewer")
});

export const stockTransactionSchema = z.object({
  productId: requiredText,
  type: z.enum(stockTransactionTypes),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  referenceNumber: optionalText,
  note: optionalText,
  transactionDate: z.coerce.date()
});

export const orderSchema = z.object({
  customerName: requiredText.max(120, "Customer name must be 120 characters or fewer"),
  customerEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  customerPhone: optionalText,
  customerAddress: optionalText,
  status: z.enum(orderStatuses),
  tax: z.coerce.number().min(0, "Tax cannot be negative").default(0),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  paymentMethod: z.enum(paymentMethods),
  paidAmount: z.coerce.number().min(0, "Paid amount cannot be negative"),
  note: optionalText,
  orderDate: z.coerce.date(),
  items: z
    .array(
      z.object({
        productId: requiredText,
        quantity: z.coerce.number().positive("Quantity must be greater than 0"),
        enteredQuantity: z.coerce.number().positive("Quantity must be greater than 0").optional(),
        enteredUnit: z.string().trim().optional()
      })
    )
    .min(1, "Add at least one product")
});

export const orderStatusSchema = z.object({
  status: z.enum(orderStatuses)
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type StockTransactionInput = z.infer<typeof stockTransactionSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
