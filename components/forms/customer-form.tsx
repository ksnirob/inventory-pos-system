"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { saveCustomer } from "@/actions/inventory";
import { Toast } from "@/components/toast";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { customerSchema, type CustomerInput } from "@/schemas/inventory";

export function CustomerForm({ customer }: { customer?: CustomerInput & { id: string } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ?? { name: "", email: "", phone: "", address: "" }
  });

  function onSubmit(values: CustomerInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));

    startTransition(async () => {
      const result = await saveCustomer(customer?.id, formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0]) setError(key as keyof CustomerInput, { message: messages[0] });
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        router.push("/customers");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Customer name" {...register("name")} error={errors.name?.message} />
        <Input label="Phone number" {...register("phone")} error={errors.phone?.message} />
        <Input label="Email address" type="email" {...register("email")} error={errors.email?.message} />
      </div>
      <Textarea label="Delivery address" {...register("address")} error={errors.address?.message} />
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <LinkButton href="/customers" variant="secondary">Cancel</LinkButton>
        <Button disabled={pending}>{pending ? "Saving..." : customer ? "Update customer" : "Add customer"}</Button>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
