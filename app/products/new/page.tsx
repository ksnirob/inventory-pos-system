import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/forms/product-form";
import { prisma } from "@/lib/prisma";

export default async function NewProductPage() {
  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <>
      <PageHeader title="Add product" description="Create a product with stock and pricing details." />
      <ProductForm categories={categories} suppliers={suppliers} />
    </>
  );
}
