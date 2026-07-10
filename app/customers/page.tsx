import Link from "next/link";
import { Pencil, Plus, Search, ShoppingBag, UserRound, UsersRound, WalletCards } from "lucide-react";
import { deleteCustomer } from "@/actions/inventory";
import { DeleteButton } from "@/components/delete-button";
import { CustomerForm } from "@/components/forms/customer-form";
import { ModalShell } from "@/components/modal-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const modal = typeof params.modal === "string" ? params.modal : "";
  const editId = typeof params.edit === "string" ? params.edit : "";

  const [customers, editingCustomer] = await Promise.all([
    prisma.customer.findMany({
      where: query
        ? { OR: [{ name: { contains: query } }, { phone: { contains: query } }, { email: { contains: query } }] }
        : undefined,
      include: { orders: { select: { id: true, total: true, orderDate: true } } },
      orderBy: { updatedAt: "desc" }
    }),
    editId ? prisma.customer.findUnique({ where: { id: editId } }) : null
  ]);

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.orders.reduce((orderSum, order) => orderSum + Number(order.total), 0), 0);
  const repeatCustomers = customers.filter((customer) => customer.orders.length > 1).length;
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orders.length, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage customer contacts and see their complete POS purchase history."
        action={{ href: "/customers?modal=customer", label: "Add customer", icon: <Plus size={16} /> }}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customer records" value={customers.length} icon={UsersRound} />
        <StatCard label="Repeat customers" value={repeatCustomers} icon={UserRound} />
        <StatCard label="Customer orders" value={totalOrders} icon={ShoppingBag} />
        <StatCard label="Customer sales" value={formatCurrency(totalRevenue)} icon={WalletCards} />
      </div>

      <form className="mb-5 flex gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <label className="relative flex-1">
          <span className="sr-only">Search customers</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input name="q" defaultValue={query} placeholder="Search name, phone, or email" className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
        </label>
        <button className="h-11 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
      </form>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total spent</th>
                <th className="px-4 py-3">Last purchase</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => {
                const spent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
                const lastOrder = customer.orders.reduce<Date | null>((latest, order) => !latest || order.orderDate > latest ? order.orderDate : latest, null);
                return (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-50 text-xs font-black text-emerald-700">{customer.name.slice(0, 2).toUpperCase()}</span>
                        <span className="font-semibold text-slate-950">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600"><p>{customer.phone || "No phone"}</p><p className="text-xs text-slate-400">{customer.email || "No email"}</p></td>
                    <td className="max-w-56 truncate px-4 py-3 text-slate-600">{customer.address || "-"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{customer.orders.length}</td>
                    <td className="px-4 py-3 font-bold text-slate-950">{formatCurrency(spent)}</td>
                    <td className="px-4 py-3 text-slate-600">{lastOrder ? formatDate(lastOrder) : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <LinkButton href={`/customers?edit=${customer.id}`} variant="secondary" className="h-9 px-3" title="Edit customer"><Pencil size={15} /></LinkButton>
                        <DeleteButton action={deleteCustomer.bind(null, customer.id)} label="" confirmMessage="Delete this customer?" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No customers found.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>{customers.length} customer records</span>
          {query ? <Link href="/customers" className="font-semibold text-emerald-700">Clear search</Link> : null}
        </div>
      </section>

      {modal === "customer" ? (
        <ModalShell title="Add customer" description="Create a reusable customer profile for POS sales." closeHref="/customers"><CustomerForm /></ModalShell>
      ) : null}
      {editingCustomer ? (
        <ModalShell title="Edit customer" description="Update customer contact and delivery details." closeHref="/customers">
          <CustomerForm customer={{ id: editingCustomer.id, name: editingCustomer.name, email: editingCustomer.email ?? "", phone: editingCustomer.phone ?? "", address: editingCustomer.address ?? "" }} />
        </ModalShell>
      ) : null}
    </>
  );
}
