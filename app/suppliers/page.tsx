import { Pencil, Plus } from "lucide-react";
import { deleteSupplier } from "@/actions/inventory";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <>
      <PageHeader title="Suppliers" description="Manage supplier contact information." action={{ href: "/suppliers/new", label: "Add supplier", icon: <Plus size={16} /> }} />
      {suppliers.length === 0 ? (
        <EmptyState title="No suppliers yet" message="Add suppliers before assigning products." />
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Contact person</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{supplier.name}</td>
                    <td className="px-4 py-3 text-slate-600">{supplier.contactPerson || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{supplier.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{supplier.phone || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{supplier._count.products}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <LinkButton href={`/suppliers/${supplier.id}/edit`} variant="secondary" className="h-9 px-3">
                          <Pencil size={15} />
                          Edit
                        </LinkButton>
                        <DeleteButton action={deleteSupplier.bind(null, supplier.id)} confirmMessage="Delete this supplier?" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
