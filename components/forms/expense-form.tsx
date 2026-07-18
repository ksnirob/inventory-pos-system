"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { saveExpense } from "@/actions/inventory";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatDateInputValue } from "@/lib/utils";
import { expenseSchema, type ExpenseInput } from "@/schemas/inventory";
import { paymentMethodLabels, paymentMethods } from "@/types/inventory";

const defaultExpenseCategories = ["Packaging", "Marketing", "General"];

export function ExpenseForm({ categories = [], onSaved }: { categories?: string[]; onSaved?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const today = formatDateInputValue();
  const categoryOptions = Array.from(new Set([...defaultExpenseCategories, ...categories])).sort();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      category: "",
      amount: 0,
      paymentMethod: "CASH",
      expenseDate: new Date(today),
      note: ""
    }
  });

  function onSubmit(values: ExpenseInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, value instanceof Date ? formatDateInputValue(value) : String(value ?? ""));
    });

    startTransition(async () => {
      const result = await saveExpense(undefined, formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0]) setError(key as keyof ExpenseInput, { message: messages[0] });
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        reset();
        onSaved?.();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Expense title" {...register("title")} error={errors.title?.message} />
        <Input label="Category" list="expense-categories" {...register("category")} error={errors.category?.message} />
        <datalist id="expense-categories">
          {categoryOptions.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <Input label="Amount" type="number" step="0.01" {...register("amount")} error={errors.amount?.message} />
        <Select label="Payment method" {...register("paymentMethod")} error={errors.paymentMethod?.message}>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{paymentMethodLabels[method]}</option>
          ))}
        </Select>
        <Input label="Expense date" type="date" defaultValue={today} {...register("expenseDate")} error={errors.expenseDate?.message} />
      </div>
      <Textarea label="Note" {...register("note")} error={errors.note?.message} />
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "Saving..." : "Save expense"}</Button>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
