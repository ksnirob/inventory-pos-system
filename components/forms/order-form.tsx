"use client";

import { Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createOrder } from "@/actions/inventory";
import { Toast } from "@/components/toast";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { OrderInput } from "@/schemas/inventory";
import { paymentMethodLabels, paymentMethods } from "@/types/inventory";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  sellingPrice: string;
  categoryName: string;
  unit: string;
};

type CartLine = {
  productId: string;
  enteredQuantity: number;
  enteredUnit: string;
};

export function OrderForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const today = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<OrderInput>({
    defaultValues: {
      customerName: "Walk-in customer",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      status: "DELIVERED",
      tax: 0,
      discount: 0,
      paymentMethod: "CASH",
      paidAmount: 0,
      note: "",
      orderDate: new Date(today),
      items: []
    }
  });

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.categoryName))).sort(), [products]);
  const filteredProducts = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return products.filter((product) => {
      const matchesSearch = !needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle);
      const matchesCategory = !category || product.categoryName === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, query]);

  const cartDetails = useMemo(() => {
    const lines = cart.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      const unitPrice = product ? Number(product.sellingPrice) : 0;
      const stockQuantity = toStockQuantity(line, product);
      return {
        ...line,
        product,
        stockQuantity,
        unitPrice,
        lineTotal: unitPrice * stockQuantity
      };
    });
    const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
    const total = Math.max(subtotal + tax - discount, 0);
    const change = Math.max(paidAmount - total, 0);
    return { lines, subtotal, total, change };
  }, [cart, discount, paidAmount, products, tax]);

  function addProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product || product.quantity <= 0) return;

    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (!existing) return [...current, { productId, enteredQuantity: 1, enteredUnit: product.unit }];
      const nextStockQuantity = toStockQuantity(
        { ...existing, enteredQuantity: existing.enteredQuantity + 1 },
        product
      );
      if (nextStockQuantity > product.quantity) return current;
      return current.map((line) => (line.productId === productId ? { ...line, enteredQuantity: line.enteredQuantity + 1 } : line));
    });
  }

  function changeQuantity(productId: string, amount: number) {
    const product = products.find((item) => item.id === productId);
    setCart((current) =>
      current
        .map((line) => {
          if (line.productId !== productId) return line;
          const nextEnteredQuantity = Math.max(0, line.enteredQuantity + amount);
          const nextStockQuantity = toStockQuantity({ ...line, enteredQuantity: nextEnteredQuantity }, product);
          if (nextStockQuantity > (product?.quantity ?? 0)) return line;
          return { ...line, enteredQuantity: nextEnteredQuantity };
        })
        .filter((line) => line.enteredQuantity > 0)
    );
  }

  function setManualQuantity(productId: string, enteredQuantity: number) {
    const product = products.find((item) => item.id === productId);
    setCart((current) =>
      current.map((line) => {
        if (line.productId !== productId) return line;
        const safeQuantity = Math.max(0, enteredQuantity);
        const stockQuantity = toStockQuantity({ ...line, enteredQuantity: safeQuantity }, product);
        if (stockQuantity > (product?.quantity ?? 0)) return line;
        return { ...line, enteredQuantity: safeQuantity };
      })
    );
  }

  function setManualUnit(productId: string, enteredUnit: string) {
    const product = products.find((item) => item.id === productId);
    setCart((current) =>
      current.map((line) => {
        if (line.productId !== productId) return line;
        const stockQuantity = toStockQuantity({ ...line, enteredUnit }, product);
        if (stockQuantity > (product?.quantity ?? 0)) return line;
        return { ...line, enteredUnit };
      })
    );
  }

  function removeProduct(productId: string) {
    setCart((current) => current.filter((line) => line.productId !== productId));
  }

  function onSubmit(values: OrderInput) {
    const formData = new FormData();
    formData.set("customerName", values.customerName || "Walk-in customer");
    formData.set("customerEmail", values.customerEmail ?? "");
    formData.set("customerPhone", values.customerPhone ?? "");
    formData.set("customerAddress", values.customerAddress ?? "");
    formData.set("status", "DELIVERED");
    formData.set("tax", String(tax));
    formData.set("discount", String(discount));
    formData.set("paymentMethod", values.paymentMethod);
    formData.set("paidAmount", String(paidAmount));
    formData.set("note", "POS sale");
    formData.set("orderDate", today);
    cart.forEach((line) => {
      const product = products.find((item) => item.id === line.productId);
      formData.append("productId", line.productId);
      formData.append("quantity", String(toStockQuantity(line, product)));
      formData.append("enteredQuantity", String(line.enteredQuantity));
      formData.append("enteredUnit", line.enteredUnit);
    });

    startTransition(async () => {
      const result = await createOrder(formData);
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages?.[0] && key in values) {
            setError(key as keyof OrderInput, { message: messages[0] });
          }
        });
      }
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        setCart([]);
        router.push(result.orderId ? `/orders/${result.orderId}?payslip=1` : "/orders");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product or SKU"
              className="h-12 w-full rounded-md border border-stone-200 bg-stone-50 pl-10 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-12 rounded-md border border-stone-200 bg-white px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product.id)}
              className="rounded-md border border-stone-200 bg-stone-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-950">{product.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{product.sku}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">Stock {product.quantity} {product.unit}</span>
              </div>
              <p className="text-lg font-bold text-stone-950">{formatCurrency(product.sellingPrice)}</p>
              <p className="mt-1 text-xs text-stone-500">{product.categoryName}</p>
            </button>
          ))}
          {filteredProducts.length === 0 ? <p className="col-span-full py-10 text-center text-sm text-stone-500">No matching products.</p> : null}
        </div>
      </section>

      <aside className="rounded-md border border-stone-200 bg-white shadow-sm xl:sticky xl:top-24 xl:self-start">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-stone-950">POS Cart</h2>
            <p className="text-sm text-stone-500">{cartDetails.lines.length} items selected</p>
          </div>
          <ShoppingBag className="text-stone-400" size={22} />
        </div>
        <div className="max-h-[360px] overflow-y-auto p-4">
          {cartDetails.lines.map((line) => (
            <div key={line.productId} className="mb-3 rounded-md border border-stone-200 bg-stone-50 p-3">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-950">{line.product?.name}</p>
                  <p className="text-xs text-stone-500">
                    {formatCurrency(line.unitPrice)} / {line.product?.unit}
                  </p>
                </div>
                <button type="button" onClick={() => removeProduct(line.productId)} className="text-red-600" aria-label="Remove product">
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="mt-3 grid gap-3">
                <div className="flex items-center rounded-md border border-stone-200 bg-white">
                  <button type="button" className="grid h-9 w-9 place-items-center" onClick={() => changeQuantity(line.productId, -1)} aria-label="Decrease quantity">
                    <Minus size={15} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={line.enteredQuantity}
                    onChange={(event) => setManualQuantity(line.productId, Number(event.target.value))}
                    className="h-9 min-w-0 flex-1 border-x border-stone-200 px-3 text-center text-sm font-semibold outline-none"
                    aria-label="Sale quantity"
                  />
                  <button type="button" className="grid h-9 w-9 place-items-center" onClick={() => changeQuantity(line.productId, 1)} aria-label="Increase quantity">
                    <Plus size={15} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  {isKgProduct(line.product) ? (
                    <select
                      value={line.enteredUnit}
                      onChange={(event) => setManualUnit(line.productId, event.target.value)}
                      className="h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
                      aria-label="Sale unit"
                    >
                      <option value="kg">kg</option>
                      <option value="gm">gm</option>
                    </select>
                  ) : (
                    <span className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm">{line.product?.unit}</span>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-stone-500">{formatSaleQuantity(line, line.product)}</p>
                    <p className="font-bold text-stone-950">{formatCurrency(line.lineTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {cartDetails.lines.length === 0 ? <p className="py-12 text-center text-sm text-stone-500">Click products to add them to the cart.</p> : null}
        </div>

        <div className="border-t border-stone-200 p-4">
          <div className="mb-4 grid gap-3">
            <Input label="Customer name" {...register("customerName")} error={errors.customerName?.message} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Phone" {...register("customerPhone")} error={errors.customerPhone?.message} />
              <Select label="Payment" {...register("paymentMethod")} error={errors.paymentMethod?.message}>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{paymentMethodLabels[method]}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Tax" type="number" step="0.01" value={tax} onChange={(event) => setTax(Number(event.target.value))} />
              <Input label="Discount" type="number" step="0.01" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
              <Input label="Paid" type="number" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(Number(event.target.value))} error={errors.paidAmount?.message} />
            </div>
          </div>
          <div className="grid gap-2 rounded-md bg-stone-50 p-4 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span className="font-semibold">{formatCurrency(cartDetails.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Tax</span><span className="font-semibold">{formatCurrency(tax)}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Discount</span><span className="font-semibold">-{formatCurrency(discount)}</span></div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-lg"><span className="font-bold">Total</span><span className="font-bold">{formatCurrency(cartDetails.total)}</span></div>
            <div className="flex justify-between text-emerald-700"><span className="font-semibold">Change</span><span className="font-bold">{formatCurrency(cartDetails.change)}</span></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LinkButton href="/orders" variant="secondary">Sales history</LinkButton>
            <Button disabled={pending || cart.length === 0}>{pending ? "Completing..." : "Complete sale"}</Button>
          </div>
        </div>
      </aside>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
  function isKgProduct(product?: ProductOption) {
    const unit = product?.unit.toLowerCase();
    return unit === "kg" || unit === "kilogram";
  }

  function toStockQuantity(line: CartLine, product?: ProductOption) {
    if (!product) return 0;
    if (isKgProduct(product) && line.enteredUnit === "gm") {
      return line.enteredQuantity / 1000;
    }
    return line.enteredQuantity;
  }

  function formatSaleQuantity(line: CartLine, product?: ProductOption) {
    if (!product) return "";
    return `${line.enteredQuantity} ${line.enteredUnit || product.unit}`;
  }
