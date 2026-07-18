import { Plus } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { ModalShell } from "@/components/modal-shell";
import { PageHeader } from "@/components/page-header";
import { ProductCatalog } from "@/components/products/product-catalog";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const modal = typeof params.modal === "string" ? params.modal : "";
  const editId = typeof params.edit === "string" ? params.edit : "";
  const [categories, suppliers, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ include: { category: true, supplier: true }, orderBy: { name: "asc" } })
  ]);
  const editProduct = editId ? products.find((product) => product.id === editId) : null;

  return <>
    <PageHeader title="Products" description="Search, filter, sort, and manage all inventory items." action={{ href: "/products?modal=product", label: "Add product", icon: <Plus size={16} /> }} />
    <ProductCatalog
      categories={categories.map((item) => ({ id: item.id, name: item.name }))}
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageMimeType ? `/api/products/${product.id}/image` : product.imageUrl,
        purchasePrice: String(product.purchasePrice), sellingPrice: String(product.sellingPrice),
        baseQuantity: Number(product.baseQuantity), quantity: Number(product.quantity), unit: product.unit, minimumStockLevel: Number(product.minimumStockLevel),
        category: { id: product.category.id, name: product.category.name }, supplier: { name: product.supplier.name }
      }))}
    />
    {(modal === "product" || editProduct) ? (
      <ModalShell
        title={editProduct ? "Edit product" : "Add product"}
        description={editProduct ? "Update product details, pricing, and stock thresholds." : "Create a product with image, stock, and pricing details."}
        closeHref="/products"
      >
        <ProductForm
          key={editProduct?.id ?? "new"}
          categories={categories}
          suppliers={suppliers}
          embedded
          product={editProduct ? {
            id: editProduct.id,
            name: editProduct.name,
            sku: editProduct.sku,
            description: editProduct.description ?? "",
            imageUrl: editProduct.imageUrl ?? "",
            previewImageUrl: editProduct.imageMimeType ? `/api/products/${editProduct.id}/image` : editProduct.imageUrl,
            categoryId: editProduct.categoryId,
            supplierId: editProduct.supplierId,
            purchasePrice: Number(editProduct.purchasePrice),
            sellingPrice: Number(editProduct.sellingPrice),
            baseQuantity: Number(editProduct.baseQuantity),
            currentQuantity: Number(editProduct.quantity),
            minimumStockLevel: Number(editProduct.minimumStockLevel),
            unit: editProduct.unit
          } : undefined}
        />
      </ModalShell>
    ) : null}
  </>;
}
