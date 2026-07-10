import { CategoryForm } from "@/components/forms/category-form";
import { PageHeader } from "@/components/page-header";

export default function NewCategoryPage() {
  return (
    <>
      <PageHeader title="Add category" description="Create a category for related inventory items." />
      <CategoryForm />
    </>
  );
}
