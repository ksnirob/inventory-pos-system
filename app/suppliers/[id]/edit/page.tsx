import { notFound } from "next/navigation";
import { SupplierForm } from "@/components/forms/supplier-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });

  if (!supplier) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Edit supplier" description="Update supplier contact and address details." />
      <SupplierForm
        supplier={{
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contactPerson ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? ""
        }}
      />
    </>
  );
}
