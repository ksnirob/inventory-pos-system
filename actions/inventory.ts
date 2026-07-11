"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  categorySchema,
  customerSchema,
  expenseSchema,
  orderSchema,
  orderStatusSchema,
  productSchema,
  stockTransactionSchema,
  supplierSchema
} from "@/schemas/inventory";
import type { ActionState } from "@/types/inventory";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapError(error: unknown): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { ok: false, message: "A record with this unique value already exists." };
    }

    if (error.code === "P2025") {
      return { ok: false, message: "The requested record could not be found." };
    }

    if (error.code === "P2003") {
      return { ok: false, message: "This record is still used by another item and cannot be deleted." };
    }
  }

  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: "Something went wrong. Please try again." };
}

function productInput(formData: FormData) {
  return {
    name: formValue(formData, "name"),
    sku: formValue(formData, "sku"),
    description: formValue(formData, "description"),
    imageUrl: formValue(formData, "imageUrl"),
    categoryId: formValue(formData, "categoryId"),
    supplierId: formValue(formData, "supplierId"),
    purchasePrice: formValue(formData, "purchasePrice"),
    sellingPrice: formValue(formData, "sellingPrice"),
    quantity: formValue(formData, "quantity"),
    minimumStockLevel: formValue(formData, "minimumStockLevel"),
    unit: formValue(formData, "unit")
  };
}

function expenseInput(formData: FormData) {
  return {
    title: formValue(formData, "title"),
    category: formValue(formData, "category"),
    amount: formValue(formData, "amount"),
    paymentMethod: formValue(formData, "paymentMethod"),
    expenseDate: formValue(formData, "expenseDate"),
    note: formValue(formData, "note")
  };
}

function orderInput(formData: FormData) {
  const productIds = formData.getAll("productId").filter((value): value is string => typeof value === "string" && value.length > 0);
  const quantities = formData.getAll("quantity").filter((value): value is string => typeof value === "string" && value.length > 0);
  const enteredQuantities = formData.getAll("enteredQuantity").filter((value): value is string => typeof value === "string" && value.length > 0);
  const enteredUnits = formData.getAll("enteredUnit").filter((value): value is string => typeof value === "string" && value.length > 0);

  return {
    customerName: formValue(formData, "customerName"),
    customerEmail: formValue(formData, "customerEmail"),
    customerPhone: formValue(formData, "customerPhone"),
    customerAddress: formValue(formData, "customerAddress"),
    status: formValue(formData, "status"),
    tax: formValue(formData, "tax"),
    discount: formValue(formData, "discount"),
    deliveryArea: formValue(formData, "deliveryArea"),
    deliveryCharge: formValue(formData, "deliveryCharge"),
    costingAmount: formValue(formData, "costingAmount"),
    paymentMethod: formValue(formData, "paymentMethod"),
    paidAmount: formValue(formData, "paidAmount"),
    note: formValue(formData, "note"),
    orderDate: formValue(formData, "orderDate"),
    items: productIds.map((productId, index) => ({
      productId,
      quantity: quantities[index] ?? "1",
      enteredQuantity: enteredQuantities[index] ?? quantities[index] ?? "1",
      enteredUnit: enteredUnits[index] ?? ""
    }))
  };
}

function createOrderNumber() {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date()).filter((part) => part.type !== "literal").map((part) => part.value).join("");
  return `ORD-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function readProductImage(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;

  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
  };
  const extension = extensions[file.type];
  if (!extension) throw new Error("Use a JPG, PNG, or WEBP image.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Product images must be 2MB or smaller.");

  return {
    data: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type
  };
}

export async function saveCategory(id: string | undefined, formData: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse({
    name: formValue(formData, "name"),
    description: formValue(formData, "description")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    if (id) {
      await prisma.category.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.category.create({ data: parsed.data });
    }

    revalidatePath("/categories");
    return { ok: true, message: id ? "Category updated." : "Category created." };
  } catch (error) {
    return mapError(error);
  }
}

export async function deleteCategory(id: string): Promise<ActionState> {
  try {
    const productCount = await prisma.product.count({ where: { categoryId: id } });

    if (productCount > 0) {
      return {
        ok: false,
        message: "This category has assigned products. Move or delete those products first."
      };
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/categories");
    return { ok: true, message: "Category deleted." };
  } catch (error) {
    return mapError(error);
  }
}

export async function saveSupplier(id: string | undefined, formData: FormData): Promise<ActionState> {
  const parsed = supplierSchema.safeParse({
    name: formValue(formData, "name"),
    contactPerson: formValue(formData, "contactPerson"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    address: formValue(formData, "address")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    if (id) {
      await prisma.supplier.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.supplier.create({ data: parsed.data });
    }

    revalidatePath("/suppliers");
    return { ok: true, message: id ? "Supplier updated." : "Supplier created." };
  } catch (error) {
    return mapError(error);
  }
}

export async function deleteSupplier(id: string): Promise<ActionState> {
  try {
    const productCount = await prisma.product.count({ where: { supplierId: id } });

    if (productCount > 0) {
      return {
        ok: false,
        message: "This supplier has assigned products. Move or delete those products first."
      };
    }

    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/suppliers");
    return { ok: true, message: "Supplier deleted." };
  } catch (error) {
    return mapError(error);
  }
}

export async function saveCustomer(id: string | undefined, formData: FormData): Promise<ActionState> {
  const parsed = customerSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    address: formValue(formData, "address")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    if (id) {
      await prisma.customer.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.customer.create({ data: parsed.data });
    }

    revalidatePath("/customers");
    revalidatePath("/orders");
    return { ok: true, message: id ? "Customer updated." : "Customer created." };
  } catch (error) {
    return mapError(error);
  }
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  try {
    const orderCount = await prisma.order.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return { ok: false, message: "Customers with sales history cannot be deleted." };
    }

    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { ok: true, message: "Customer deleted." };
  } catch (error) {
    return mapError(error);
  }
}

export async function saveProduct(id: string | undefined, formData: FormData): Promise<ActionState> {
  let image: Awaited<ReturnType<typeof readProductImage>> = null;
  try {
    image = await readProductImage(formData);
  } catch (error) {
    return mapError(error);
  }

  const values = productInput(formData);
  const parsed = productSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const productData = image
      ? {
          ...parsed.data,
          imageUrl: null,
          imageData: image.data,
          imageMimeType: image.mimeType
        }
      : parsed.data;

    if (id) {
      await prisma.product.update({ where: { id }, data: productData });
    } else {
      await prisma.product.create({ data: productData });
    }

    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/reports");
    return { ok: true, message: id ? "Product updated." : "Product created." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "SKU values must be unique.", fieldErrors: { sku: ["This SKU already exists."] } };
    }

    return mapError(error);
  }
}

export async function saveExpense(id: string | undefined, formData: FormData): Promise<ActionState> {
  const parsed = expenseSchema.safeParse(expenseInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    if (id) {
      await prisma.expense.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.expense.create({ data: parsed.data });
    }

    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/");
    return { ok: true, message: id ? "Expense updated." : "Expense recorded." };
  } catch (error) {
    return mapError(error);
  }
}

export async function deleteExpense(id: string): Promise<ActionState> {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/");
    return { ok: true, message: "Expense deleted." };
  } catch (error) {
    return mapError(error);
  }
}

export async function deleteProduct(id: string): Promise<ActionState> {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/stock");
    return { ok: true, message: "Product deleted." };
  } catch (error) {
    return mapError(error);
  }
}

export async function createStockTransaction(formData: FormData): Promise<ActionState> {
  const parsed = stockTransactionSchema.safeParse({
    productId: formValue(formData, "productId"),
    type: formValue(formData, "type"),
    quantity: formValue(formData, "quantity"),
    referenceNumber: formValue(formData, "referenceNumber"),
    note: formValue(formData, "note"),
    transactionDate: formValue(formData, "transactionDate")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: parsed.data.productId } });

      if (!product) {
        throw new Error("The selected product could not be found.");
      }

      const previousQuantity = Number(product.quantity);
      let newQuantity = previousQuantity;

      if (parsed.data.type === "STOCK_IN") {
        newQuantity = previousQuantity + parsed.data.quantity;
      }

      if (parsed.data.type === "STOCK_OUT") {
        newQuantity = previousQuantity - parsed.data.quantity;
      }

      if (parsed.data.type === "ADJUSTMENT") {
        newQuantity = parsed.data.quantity;
      }

      if (newQuantity < 0) {
        throw new Error("Stock quantity cannot become negative.");
      }

      await tx.product.update({
        where: { id: product.id },
        data: { quantity: newQuantity }
      });

      await tx.stockTransaction.create({
        data: {
          productId: product.id,
          type: parsed.data.type,
          quantity: parsed.data.quantity,
          previousQuantity,
          newQuantity,
          referenceNumber: parsed.data.referenceNumber,
          note: parsed.data.note,
          transactionDate: parsed.data.transactionDate
        }
      });
    });

    revalidatePath("/stock");
    revalidatePath("/reports");
    revalidatePath("/products");
    revalidatePath("/");
    return { ok: true, message: "Stock transaction recorded." };
  } catch (error) {
    return mapError(error);
  }
}

export async function createOrder(formData: FormData): Promise<ActionState> {
  const parsed = orderSchema.safeParse(orderInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted order fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      const productIds = parsed.data.items.map((item) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((product) => [product.id, product]));

      let subtotal = 0;
      const orderItems = parsed.data.items.map((item) => {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error("One of the selected products could not be found.");
        }

        const currentQuantity = Number(product.quantity);
        if (currentQuantity < item.quantity) {
          throw new Error(`${product.name} only has ${currentQuantity} ${product.unit} available.`);
        }

        const unitPrice = Number(product.sellingPrice);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        return {
          product,
          quantity: item.quantity,
          enteredQuantity: item.enteredQuantity ?? item.quantity,
          enteredUnit: item.enteredUnit || product.unit,
          unitPrice,
          lineTotal
        };
      });

      const total = subtotal + parsed.data.tax + parsed.data.deliveryCharge - parsed.data.discount;
      const changeDue = Math.max(parsed.data.paidAmount - total, 0);

      if (total < 0) {
        throw new Error("Order total cannot be negative.");
      }

      if (parsed.data.status !== "PENDING" && parsed.data.paidAmount < total) {
        throw new Error("Amount must cover the sale total.");
      }

      const customerMatch = parsed.data.customerPhone
        ? { phone: parsed.data.customerPhone }
        : parsed.data.customerEmail
          ? { email: parsed.data.customerEmail }
          : { name: parsed.data.customerName };
      const existingCustomer = await tx.customer.findFirst({ where: customerMatch });
      const customer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: parsed.data.customerName,
              email: parsed.data.customerEmail || existingCustomer.email,
              phone: parsed.data.customerPhone || existingCustomer.phone,
              address: parsed.data.customerAddress || existingCustomer.address
            }
          })
        : await tx.customer.create({
            data: {
              name: parsed.data.customerName,
              email: parsed.data.customerEmail,
              phone: parsed.data.customerPhone,
              address: parsed.data.customerAddress
            }
          });

      const order = await tx.order.create({
        data: {
          orderNumber: createOrderNumber(),
          customerId: customer.id,
          status: parsed.data.status,
          subtotal,
          tax: parsed.data.tax,
          discount: parsed.data.discount,
          deliveryArea: parsed.data.deliveryArea,
          deliveryCharge: parsed.data.deliveryCharge,
          costingAmount: parsed.data.costingAmount,
          total,
          paymentMethod: parsed.data.paymentMethod,
          paidAmount: parsed.data.paidAmount,
          changeDue,
          note: parsed.data.note,
          orderDate: parsed.data.orderDate
        }
      });

      for (const item of orderItems) {
        const previousQuantity = Number(item.product.quantity);
        const newQuantity = previousQuantity - item.quantity;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            quantity: item.quantity,
            enteredQuantity: item.enteredQuantity,
            enteredUnit: item.enteredUnit,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal
          }
        });

        await tx.product.update({
          where: { id: item.product.id },
          data: { quantity: newQuantity }
        });

        await tx.stockTransaction.create({
          data: {
            productId: item.product.id,
            type: "STOCK_OUT",
            quantity: item.quantity,
            previousQuantity,
            newQuantity,
            referenceNumber: order.orderNumber,
            note: "Order fulfillment",
            transactionDate: parsed.data.orderDate
          }
        });
      }

      return order.id;
    });

    revalidatePath("/orders");
    revalidatePath("/customers");
    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/");
    return { ok: true, message: "Sale completed and POS payslip generated.", orderId };
  } catch (error) {
    return mapError(error);
  }
}

export async function updateOrderStatus(id: string, formData: FormData): Promise<ActionState> {
  const parsed = orderStatusSchema.safeParse({ status: formValue(formData, "status") });

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid order status." };
  }

  try {
    await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath("/");
    return { ok: true, message: "Order status updated." };
  } catch (error) {
    return mapError(error);
  }
}
