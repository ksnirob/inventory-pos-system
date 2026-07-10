import { Plus } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { ProductTable } from "@/components/products/product-table";
import { ProductForm } from "@/components/forms/product-form";
import { ModalShell } from "@/components/modal-shell";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getStockStatus } from "@/lib/utils";

const pageSize = 10;

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "";
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "";
  const modal = typeof resolvedSearchParams.modal === "string" ? resolvedSearchParams.modal : "";
  const page = Math.max(Number(resolvedSearchParams.page ?? 1), 1);
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : "createdAt";
  const direction = resolvedSearchParams.direction === "asc" ? "asc" : "desc";

  const [categories, suppliers, productsAll] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { sku: { contains: query } },
                  { description: { contains: query } }
                ]
              }
            : {},
          category ? { categoryId: category } : {}
        ]
      },
      include: { category: true, supplier: true }
    })
  ]);

  const filtered = status
    ? productsAll.filter((product) => getStockStatus(Number(product.quantity), Number(product.minimumStockLevel)) === status)
    : productsAll;

  const sorted = [...filtered].sort((a, b) => {
    const multiplier = direction === "asc" ? 1 : -1;
    const left =
      sort === "category" ? a.category.name :
      sort === "supplier" ? a.supplier.name :
      sort === "purchasePrice" ? Number(a.purchasePrice) :
      sort === "sellingPrice" ? Number(a.sellingPrice) :
      sort === "quantity" ? Number(a.quantity) :
      sort === "sku" ? a.sku :
      a.name;
    const right =
      sort === "category" ? b.category.name :
      sort === "supplier" ? b.supplier.name :
      sort === "purchasePrice" ? Number(b.purchasePrice) :
      sort === "sellingPrice" ? Number(b.sellingPrice) :
      sort === "quantity" ? Number(b.quantity) :
      sort === "sku" ? b.sku :
      b.name;

    return String(left).localeCompare(String(right), undefined, { numeric: true }) * multiplier;
  });

  const totalPages = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const pageProducts = sorted.slice((page - 1) * pageSize, page * pageSize);

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        params.set(key, value);
      }
    });
    params.set("page", String(nextPage));
    return `/products?${params.toString()}`;
  }

  return (
    <>
      <PageHeader title="Products" description="Search, filter, sort, and manage all inventory items." action={{ href: "/products?modal=product", label: "Add product", icon: <Plus size={16} /> }} />
      <FilterBar
        search={query}
        category={category}
        status={status}
        categories={categories.map((item) => ({ value: item.id, label: item.name }))}
        resetHref="/products"
      />
      <ProductTable products={pageProducts} searchParams={resolvedSearchParams} />
      {modal === "product" ? (
        <ModalShell title="Add product" description="Create a product with image, stock, and pricing details." closeHref="/products">
          <ProductForm categories={categories} suppliers={suppliers} embedded />
        </ModalShell>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <LinkButton href={pageHref(Math.max(page - 1, 1))} variant="secondary" className="h-9 px-3">Previous</LinkButton>
          <LinkButton href={pageHref(Math.min(page + 1, totalPages))} variant="secondary" className="h-9 px-3">Next</LinkButton>
        </div>
      </div>
    </>
  );
}
