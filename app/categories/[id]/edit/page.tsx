import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/forms/category-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Edit category" description="Update this category name and description." />
      <CategoryForm category={{ id: category.id, name: category.name, description: category.description ?? "" }} />
    </>
  );
}
