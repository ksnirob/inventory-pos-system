"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { saveProduct } from "@/actions/inventory";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Toast } from "@/components/toast";
import { productSchema, type ProductInput } from "@/schemas/inventory";

type Option = { id: string; name: string };

export function ProductForm({
  product,
  categories,
  suppliers
}: {
  product?: ProductInput & { id: string };
  categories: Option[];
  suppliers: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      name: "",
      sku: "",
      description: "",
      categoryId: "",
      supplierId: "",
      purchasePrice: 0,
      sellingPrice: 0,
      quantity: 0,
      minimumStockLevel: 0,
      unit: "piece"
    }
  });

  function onSubmit(values: ProductInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));

    startTransition(async () => {
      const result = await saveProduct(product?.id, formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0]) {
            setError(key as keyof ProductInput, { message: messages[0] });
          }
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        router.push("/products");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-5xl gap-4 rounded-md border border-slate-200 bg-white p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Input label="Product name" {...register("name")} error={errors.name?.message} />
        <Input label="SKU" {...register("sku")} error={errors.sku?.message} />
        <Select label="Category" {...register("categoryId")} error={errors.categoryId?.message}>
          <option value="">Select category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Select>
        <Select label="Supplier" {...register("supplierId")} error={errors.supplierId?.message}>
          <option value="">Select supplier</option>
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </Select>
        <Input label="Purchase price" type="number" step="0.01" {...register("purchasePrice")} error={errors.purchasePrice?.message} />
        <Input label="Selling price" type="number" step="0.01" {...register("sellingPrice")} error={errors.sellingPrice?.message} />
        <Input label="Current quantity" type="number" step="0.001" {...register("quantity")} error={errors.quantity?.message} />
        <Input label="Minimum stock level" type="number" step="0.001" {...register("minimumStockLevel")} error={errors.minimumStockLevel?.message} />
        <Select label="Unit" {...register("unit")} error={errors.unit?.message}>
          <option value="piece">Piece</option>
          <option value="box">Box</option>
          <option value="kg">Kilogram</option>
          <option value="litre">Litre</option>
        </Select>
      </div>
      <Textarea label="Description" {...register("description")} error={errors.description?.message} />
      <div className="flex flex-wrap justify-end gap-3">
        <LinkButton href="/products" variant="secondary">Cancel</LinkButton>
        <Button disabled={pending}>{pending ? "Saving..." : "Save product"}</Button>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
