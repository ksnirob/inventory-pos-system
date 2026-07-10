import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/forms/product-form";
import { prisma } from "@/lib/prisma";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, suppliers] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!product) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Edit product" description="Update product details, pricing, and stock thresholds." />
      <ProductForm
        categories={categories}
        suppliers={suppliers}
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description ?? "",
          imageUrl: product.imageUrl ?? "",
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          purchasePrice: Number(product.purchasePrice),
          sellingPrice: Number(product.sellingPrice),
          quantity: Number(product.quantity),
          minimumStockLevel: Number(product.minimumStockLevel),
          unit: product.unit
        }}
      />
    </>
  );
}
