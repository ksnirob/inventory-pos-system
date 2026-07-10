"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { saveSupplier } from "@/actions/inventory";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Toast } from "@/components/toast";
import { supplierSchema, type SupplierInput } from "@/schemas/inventory";

export function SupplierForm({ supplier }: { supplier?: SupplierInput & { id: string } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier ?? { name: "", contactPerson: "", email: "", phone: "", address: "" }
  });

  function onSubmit(values: SupplierInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));

    startTransition(async () => {
      const result = await saveSupplier(supplier?.id, formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0]) {
            setError(key as keyof SupplierInput, { message: messages[0] });
          }
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        router.push("/suppliers");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 rounded-md border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Supplier name" {...register("name")} error={errors.name?.message} />
        <Input label="Contact person" {...register("contactPerson")} error={errors.contactPerson?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Phone number" {...register("phone")} error={errors.phone?.message} />
      </div>
      <Textarea label="Address" {...register("address")} error={errors.address?.message} />
      <div className="flex flex-wrap justify-end gap-3">
        <LinkButton href="/suppliers" variant="secondary">Cancel</LinkButton>
        <Button disabled={pending}>{pending ? "Saving..." : "Save supplier"}</Button>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
