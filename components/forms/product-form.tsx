"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { saveProduct } from "@/actions/inventory";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Toast } from "@/components/toast";
import { productSchema, type ProductInput } from "@/schemas/inventory";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

export function ProductForm({
  product,
  categories,
  suppliers,
  embedded = false
}: {
  product?: ProductInput & { id: string; previewImageUrl?: string | null; currentQuantity?: number };
  categories: Option[];
  suppliers: Option[];
  embedded?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [imageFile, setImageFile] = useState<File | null>(null);
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
      imageUrl: "",
      categoryId: "",
      supplierId: "",
      purchasePrice: 0,
      sellingPrice: 0,
      baseQuantity: 1,
      minimumStockLevel: 0,
      unit: "piece"
    }
  });

  function onSubmit(values: ProductInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    if (imageFile) formData.set("image", imageFile);

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
    <form onSubmit={handleSubmit(onSubmit)} className={cn("grid max-w-5xl gap-4", embedded ? "" : "rounded-md border border-slate-200 bg-white p-5")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Input label="Product name" {...register("name")} error={errors.name?.message} />
        <Input label="SKU" {...register("sku")} error={errors.sku?.message} />
        <input type="hidden" {...register("imageUrl")} />
        <label className="grid gap-1.5 text-[13px] font-semibold text-slate-700">
          Product image
          <span className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 px-3 text-sm font-medium text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="min-w-0 flex-1 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
          </span>
          <span className="text-[11px] font-normal text-slate-500">JPG, PNG, or WEBP up to 2MB{imageFile ? ` · ${imageFile.name}` : ""}</span>
          {product?.previewImageUrl || product?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.previewImageUrl || product.imageUrl} alt="Current product" className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200" />
          ) : null}
        </label>
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
        <label className="grid gap-1.5 text-[13px] font-semibold text-slate-700">
          Quantity
          <span className="grid gap-2 sm:grid-cols-[1fr_150px]">
            <input
              type="number"
              step="0.001"
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              {...register("baseQuantity")}
            />
            <span className="relative">
              <select
                aria-label="Unit"
                className="h-11 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-10 text-sm text-slate-950 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                {...register("unit")}
              >
                <option value="piece">Piece</option>
                <option value="box">Box</option>
                <option value="kg">Kilogram</option>
                <option value="litre">Litre</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
            </span>
          </span>
          {errors.baseQuantity?.message ? <span className="text-xs font-medium text-rose-600">{errors.baseQuantity.message}</span> : null}
          {errors.unit?.message ? <span className="text-xs font-medium text-rose-600">{errors.unit.message}</span> : null}
        </label>
        <Input label="Minimum stock level" type="number" step="0.001" {...register("minimumStockLevel")} error={errors.minimumStockLevel?.message} />
        {product ? (
          <Input label="Current quantity" type="number" value={product.currentQuantity ?? 0} disabled readOnly />
        ) : null}
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
