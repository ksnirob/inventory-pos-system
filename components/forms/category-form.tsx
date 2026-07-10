"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { saveCategory } from "@/actions/inventory";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Toast } from "@/components/toast";
import { categorySchema, type CategoryInput } from "@/schemas/inventory";
import { cn } from "@/lib/utils";

export function CategoryForm({
  category,
  embedded = false
}: {
  category?: CategoryInput & { id: string };
  embedded?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ?? { name: "", description: "" }
  });

  function onSubmit(values: CategoryInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));

    startTransition(async () => {
      const result = await saveCategory(category?.id, formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0]) {
            setError(key as keyof CategoryInput, { message: messages[0] });
          }
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        router.push("/categories");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("grid max-w-2xl gap-4", embedded ? "" : "rounded-md border border-slate-200 bg-white p-5")}>
      <Input label="Category name" {...register("name")} error={errors.name?.message} />
      <Textarea label="Description" {...register("description")} error={errors.description?.message} />
      <div className="flex flex-wrap justify-end gap-3">
        <LinkButton href="/categories" variant="secondary">Cancel</LinkButton>
        <Button disabled={pending}>{pending ? "Saving..." : "Save category"}</Button>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
