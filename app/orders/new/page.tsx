import { OrderForm } from "@/components/forms/order-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function NewOrderPage() {
  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      where: { quantity: { gt: 0 } },
      include: { category: true },
      orderBy: { name: "asc" }
    }),
    prisma.customer.findMany({ orderBy: { updatedAt: "desc" }, take: 100 })
  ]);

  return (
    <>
      <PageHeader title="POS Checkout" description="Select products, collect payment, and complete the sale." />
      <OrderForm
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          imageUrl: product.imageMimeType ? `/api/products/${product.id}/image` : product.imageUrl,
          quantity: Number(product.quantity),
          sellingPrice: String(product.sellingPrice),
          purchasePrice: String(product.purchasePrice),
          categoryName: product.category.name,
          unit: product.unit
        }))}
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        }))}
      />
    </>
  );
}
