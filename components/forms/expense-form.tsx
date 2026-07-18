"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { saveExpense } from "@/actions/inventory";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatDateInputValue } from "@/lib/utils";
import { expenseSchema, type ExpenseInput } from "@/schemas/inventory";
import { paymentMethodLabels, paymentMethods } from "@/types/inventory";

const defaultExpenseCategories = ["Packaging", "Marketing", "General"];
const newCategoryValue = "__new_category__";

type EditableExpense = {
  id: string;
  title: string;
  category: string;
  amount: string;
  paymentMethod: ExpenseInput["paymentMethod"];
  expenseDate: string;
  note: string;
};

export function ExpenseForm({
  categories = [],
  expense,
  onSaved
}: {
  categories?: string[];
  expense?: EditableExpense;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const [newCategory, setNewCategory] = useState("");
  const today = formatDateInputValue();
  const categoryOptions = Array.from(new Set([...defaultExpenseCategories, ...categories, expense?.category].filter(Boolean) as string[])).sort();
  const defaultValues = {
    title: expense?.title ?? "",
    category: expense?.category ?? "General",
    amount: expense ? Number(expense.amount) : 0,
    paymentMethod: expense?.paymentMethod ?? "CASH",
    expenseDate: (expense?.expenseDate ?? today) as unknown as Date,
    note: expense?.note ?? ""
  };
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors }
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues
  });
  const selectedCategory = useWatch({ control, name: "category" });

  useEffect(() => {
    reset(defaultValues);
    setNewCategory("");
  }, [expense?.id]);

  function onSubmit(values: ExpenseInput) {
    const category = values.category === newCategoryValue ? newCategory.trim() : values.category;
    if (!category) {
      setError("category", { message: "This field is required" });
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, value instanceof Date ? formatDateInputValue(value) : String(value ?? ""));
    });
    formData.set("category", category);

    startTransition(async () => {
      const result = await saveExpense(expense?.id, formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0]) setError(key as keyof ExpenseInput, { message: messages[0] });
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        if (expense) {
          router.push("/expenses");
        } else {
          reset();
          setNewCategory("");
        }
        onSaved?.();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Expense title" {...register("title")} error={errors.title?.message} />
        <Select label="Category" {...register("category")} error={errors.category?.message}>
          <option value="">Select category</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category} />
          ))}
          <option value={newCategoryValue}>Add new category</option>
        </Select>
        {selectedCategory === newCategoryValue ? (
          <Input
            label="New category"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            error={errors.category?.message}
          />
        ) : null}
        <Input label="Amount" type="number" step="0.01" {...register("amount")} error={errors.amount?.message} />
        <Select label="Payment method" {...register("paymentMethod")} error={errors.paymentMethod?.message}>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{paymentMethodLabels[method]}</option>
          ))}
        </Select>
        <Input label="Expense date" type="date" {...register("expenseDate")} error={errors.expenseDate?.message} />
      </div>
      <Textarea label="Note" {...register("note")} error={errors.note?.message} />
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "Saving..." : expense ? "Update expense" : "Save expense"}</Button>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
