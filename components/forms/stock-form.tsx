"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createStockTransaction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Toast } from "@/components/toast";
import { formatDateInputValue, formatQuantity } from "@/lib/utils";
import { stockTransactionSchema, type StockTransactionInput } from "@/schemas/inventory";

type ProductOption = { id: string; name: string; sku: string; quantity: number; unit: string };

function isKgUnit(unit: string) {
  return ["kg", "kilogram", "kilograms"].includes(unit.toLowerCase());
}

function toStockQuantity(quantity: number, inputUnit: string) {
  return inputUnit === "gm" ? quantity / 1000 : quantity;
}

export function StockForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const [quantityUnit, setQuantityUnit] = useState("unit");
  const today = formatDateInputValue();
  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors }
  } = useForm<StockTransactionInput>({
    resolver: zodResolver(stockTransactionSchema),
    defaultValues: {
      productId: "",
      type: "STOCK_IN",
      quantity: 1,
      referenceNumber: "",
      note: "",
      transactionDate: new Date(today)
    }
  });
  const selectedProductId = useWatch({ control, name: "productId" });
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedUnit = selectedProduct?.unit ?? "";
  const supportsGramEntry = selectedProduct ? isKgUnit(selectedProduct.unit) : false;
  const activeQuantityUnit = supportsGramEntry
    ? ["gm", "kg"].includes(quantityUnit) ? quantityUnit : "gm"
    : selectedUnit || "unit";

  function onSubmit(values: StockTransactionInput) {
    const formData = new FormData();
    const normalizedQuantity = toStockQuantity(values.quantity, activeQuantityUnit);

    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, value instanceof Date ? formatDateInputValue(value) : String(value ?? ""));
    });
    formData.set("quantity", String(normalizedQuantity));

    startTransition(async () => {
      const result = await createStockTransaction(formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0]) {
            setError(key as keyof StockTransactionInput, { message: messages[0] });
          }
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        reset({
          productId: "",
          type: "STOCK_IN",
          quantity: 1,
          referenceNumber: "",
          note: "",
          transactionDate: new Date(today)
        });
        router.refresh();
      }
    });
  }

  return (
    <form data-stock-form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-3">
        <Select label="Product" {...register("productId")} error={errors.productId?.message}>
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.sku}) - Stock {formatQuantity(product.quantity, product.unit)}
            </option>
          ))}
        </Select>
        <Select label="Transaction type" {...register("type")} error={errors.type?.message}>
          <option value="STOCK_IN">Stock In</option>
          <option value="STOCK_OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </Select>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-stone-700">Quantity</span>
          <div className="grid grid-cols-[1fr_96px] overflow-hidden rounded-md border border-slate-200 bg-white transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
            <input
              type="number"
              min="0"
              step="0.001"
              className="h-11 border-0 px-3 text-sm outline-none"
              aria-label="Quantity"
              {...register("quantity")}
            />
            <label className="relative">
              <select
                aria-label="Quantity unit"
                className="h-11 w-full appearance-none border-l border-stone-200 bg-stone-50 pl-3 pr-9 text-sm font-semibold text-stone-700 outline-none"
                value={activeQuantityUnit}
                onChange={(event) => setQuantityUnit(event.target.value)}
                disabled={!selectedProduct}
              >
                {supportsGramEntry ? (
                  <>
                    <option value="gm">gm</option>
                    <option value="kg">kg</option>
                  </>
                ) : (
                  <option value={selectedUnit}>{selectedUnit || "unit"}</option>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-700" size={15} />
            </label>
          </div>
          {errors.quantity?.message ? <span className="text-xs font-medium text-red-600">{errors.quantity.message}</span> : null}
          {selectedProduct ? (
            <span className="text-xs font-medium text-stone-500">
              Current stock: {formatQuantity(selectedProduct.quantity, selectedProduct.unit)}
              {supportsGramEntry ? " . Enter 250 gm to save 0.25 kg." : null}
            </span>
          ) : null}
        </div>
        <Input label="Reference number" {...register("referenceNumber")} error={errors.referenceNumber?.message} />
        <Input label="Transaction date" type="date" defaultValue={today} {...register("transactionDate")} error={errors.transactionDate?.message} />
      </div>
      <Textarea label="Note" {...register("note")} error={errors.note?.message} />
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "Recording..." : "Record transaction"}</Button>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
