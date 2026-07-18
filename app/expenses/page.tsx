import { Plus, ReceiptText, TrendingDown, Wallet } from "lucide-react";
import { deleteExpense } from "@/actions/inventory";
import { DeleteButton } from "@/components/delete-button";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ModalShell } from "@/components/modal-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button, LinkButton } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateInputValue } from "@/lib/utils";

export default async function ExpensesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "";
  const from = typeof resolvedSearchParams.from === "string" ? resolvedSearchParams.from : "";
  const to = typeof resolvedSearchParams.to === "string" ? resolvedSearchParams.to : "";
  const modal = typeof resolvedSearchParams.modal === "string" ? resolvedSearchParams.modal : "";
  const editId = typeof resolvedSearchParams.edit === "string" ? resolvedSearchParams.edit : "";

  const [expenses, expenseCategories, editExpense] = await Promise.all([
    prisma.expense.findMany({
      where: {
        category: category || undefined,
        expenseDate: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined
        }
      },
      orderBy: { expenseDate: "desc" }
    }),
    prisma.expense.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" }
    }),
    editId ? prisma.expense.findUnique({ where: { id: editId } }) : null
  ]);

  const categories = expenseCategories.map((expense) => expense.category);
  const totalExpense = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const todayExpense = expenses
    .filter((expense) => expense.expenseDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((total, expense) => total + Number(expense.amount), 0);

  return (
    <>
      <PageHeader title="Expenses" description="Track business costs separately from POS sales." action={{ href: "/expenses?modal=expense", label: "Add expense", icon: <Plus size={16} /> }} />

      <form className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_160px_auto]">
        <input name="category" defaultValue={category} list="expense-page-categories" placeholder="Category" className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
        <datalist id="expense-page-categories">
          {categories.map((item) => <option key={item} value={item} />)}
        </datalist>
        <input type="date" name="from" defaultValue={from} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" aria-label="From date" />
        <input type="date" name="to" defaultValue={to} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" aria-label="To date" />
        <Button type="submit">Filter</Button>
      </form>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Expenses shown" value={expenses.length} icon={ReceiptText} />
        <StatCard label="Total expense" value={formatCurrency(totalExpense)} icon={TrendingDown} />
        <StatCard label="Today expense" value={formatCurrency(todayExpense)} icon={Wallet} />
      </div>

      <section className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
              <tr>
                <th className="px-4 py-3">Expense</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-950">{expense.title}</p>
                    <p className="text-xs text-stone-500">{expense.note || "No note"}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{expense.category}</td>
                  <td className="px-4 py-3 text-stone-600">{expense.paymentMethod.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(String(expense.amount))}</td>
                  <td className="px-4 py-3 text-stone-600">{formatDate(expense.expenseDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <LinkButton href={`/expenses?edit=${expense.id}`} variant="secondary" className="h-9 px-3">
                        Edit
                      </LinkButton>
                      <DeleteButton action={deleteExpense.bind(null, expense.id)} label="" confirmMessage="Delete this expense?" />
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-stone-500">No expenses found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      {(modal === "expense" || editExpense) ? (
        <ModalShell
          title={editExpense ? "Edit expense" : "Add expense"}
          description={editExpense ? "Update this business cost entry." : "Record a new business cost."}
          closeHref="/expenses"
        >
          <ExpenseForm
            key={editExpense?.id ?? "new"}
            categories={categories}
            expense={editExpense ? {
              id: editExpense.id,
              title: editExpense.title,
              category: editExpense.category,
              amount: String(editExpense.amount),
              paymentMethod: editExpense.paymentMethod as "CASH" | "CARD" | "MOBILE_BANKING" | "BANK_TRANSFER",
              expenseDate: formatDateInputValue(editExpense.expenseDate),
              note: editExpense.note ?? ""
            } : undefined}
          />
        </ModalShell>
      ) : null}
    </>
  );
}
