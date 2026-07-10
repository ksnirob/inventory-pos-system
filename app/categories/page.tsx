import { Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { deleteCategory } from "@/actions/inventory";
import { CategoryForm } from "@/components/forms/category-form";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { ModalShell } from "@/components/modal-shell";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function CategoriesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const modal = typeof resolvedSearchParams.modal === "string" ? resolvedSearchParams.modal : "";
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <>
      <PageHeader title="Categories" description="Group products into clear inventory categories." action={{ href: "/categories?modal=category", label: "Add category", icon: <Plus size={16} /> }} />
      {categories.length === 0 ? (
        <EmptyState title="No categories yet" message="Create categories before adding products." />
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{category.name}</td>
                    <td className="px-4 py-3 text-slate-600">{category.description || "No description"}</td>
                    <td className="px-4 py-3 text-slate-600">{category._count.products}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(category.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <LinkButton href={`/categories/${category.id}/edit`} variant="secondary" className="h-9 px-3">
                          <Pencil size={15} />
                          Edit
                        </LinkButton>
                        <DeleteButton action={deleteCategory.bind(null, category.id)} confirmMessage="Delete this category?" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            <Link href="/products" className="font-medium text-slate-900">View products</Link>
          </div>
        </div>
      )}
      {modal === "category" ? (
        <ModalShell title="Add category" description="Create a category for related inventory items." closeHref="/categories">
          <CategoryForm embedded />
        </ModalShell>
      ) : null}
    </>
  );
}
