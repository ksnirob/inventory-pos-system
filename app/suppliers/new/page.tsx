import { SupplierForm } from "@/components/forms/supplier-form";
import { PageHeader } from "@/components/page-header";

export default function NewSupplierPage() {
  return (
    <>
      <PageHeader title="Add supplier" description="Create a supplier profile with contact details." />
      <SupplierForm />
    </>
  );
}
