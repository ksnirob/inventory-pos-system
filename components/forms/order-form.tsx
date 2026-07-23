"use client";

import { ChevronDown, MapPin, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { createOrder } from "@/actions/inventory";
import { Toast } from "@/components/toast";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatCurrency, formatDateInputValue, formatQuantity } from "@/lib/utils";
import type { RuntimeSettings } from "@/lib/settings";
import type { OrderInput } from "@/schemas/inventory";
import { paymentMethodLabels, paymentMethods } from "@/types/inventory";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  baseQuantity: number;
  sellingPrice: string;
  purchasePrice: string;
  categoryName: string;
  unit: string;
};

type CartLine = {
  productId: string;
  enteredQuantity: number;
  enteredUnit: string;
};

type CustomerOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export function OrderForm({ products, customers, settings }: { products: ProductOption[]; customers: CustomerOption[]; settings: RuntimeSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [deliveryArea, setDeliveryArea] = useState("NONE");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [quantityModal, setQuantityModal] = useState<CartLine | null>(null);
  const today = formatDateInputValue();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors }
  } = useForm<OrderInput>({
    defaultValues: {
      customerName: "Walk-in customer",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      status: "CONFIRMED",
      discount: 0,
      deliveryArea: "NONE",
      deliveryCharge: 0,
      paymentMethod: "CASH",
      paidAmount: 0,
      note: "",
      orderDate: new Date(),
      items: []
    }
  });

  const customerNameValue = useWatch({ control, name: "customerName" });
  const customerPhoneValue = useWatch({ control, name: "customerPhone" });
  const customerNameField = register("customerName");
  const customerPhoneField = register("customerPhone");
  const customerNeedle = (customerNameValue === "Walk-in customer" ? customerPhoneValue ?? "" : `${customerNameValue ?? ""} ${customerPhoneValue ?? ""}`).trim().toLowerCase();
  const matchingCustomers = useMemo(() => {
    if (selectedCustomerId || !customerNeedle || customerNeedle === "walk-in customer") return [];
    return customers.filter((customer) => `${customer.name} ${customer.phone ?? ""} ${customer.email ?? ""}`.toLowerCase().includes(customerNeedle)).slice(0, 5);
  }, [customerNeedle, customers, selectedCustomerId]);

  function chooseCustomer(customer: CustomerOption) {
    setSelectedCustomerId(customer.id);
    setValue("customerName", customer.name, { shouldValidate: true });
    setValue("customerPhone", customer.phone ?? "", { shouldValidate: true });
    setValue("customerEmail", customer.email ?? "", { shouldValidate: true });
    setValue("customerAddress", customer.address ?? "", { shouldValidate: true });
  }

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
      const unitPrice = getSaleUnitPrice(product);
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
    const total = Math.max(subtotal + deliveryCharge - discount, 0);
    const change = Math.max(paidAmount - total, 0);
    return { lines, subtotal, total, change };
  }, [cart, deliveryCharge, discount, paidAmount, products]);

  const cartReservedStock = useMemo(() => {
    return cart.reduce<Record<string, number>>((reserved, line) => {
      const product = products.find((item) => item.id === line.productId);
      reserved[line.productId] = (reserved[line.productId] ?? 0) + toStockQuantity(line, product);
      return reserved;
    }, {});
  }, [cart, products]);

  function updateDeliveryArea(nextArea: string) {
    setDeliveryArea(nextArea);
    setDeliveryCharge(settings.deliveryOptions.find((option) => option.id === nextArea)?.amount ?? 0);
  }

  function addProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product || product.quantity <= 0) return;

    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (!existing) {
        return [...current, { productId, ...getInitialCartQuantity(product) }];
      }
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
          const nextEnteredQuantity = roundQuantity(Math.max(0, line.enteredQuantity + amount));
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
        const safeQuantity = roundQuantity(Math.max(0, enteredQuantity));
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
        const nextLine = convertCartUnit(line, product, enteredUnit);
        const stockQuantity = toStockQuantity(nextLine, product);
        if (stockQuantity > (product?.quantity ?? 0)) return line;
        return nextLine;
      })
    );
  }

  function handleProductClick(product: ProductOption) {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      openQuantityModal(product);
      return;
    }

    addProduct(product.id);
  }

  function openQuantityModal(product: ProductOption) {
    const existing = cart.find((line) => line.productId === product.id);
    setQuantityModal(existing ?? { productId: product.id, ...getInitialCartQuantity(product) });
  }

  function changeModalQuantity(amount: number) {
    setQuantityModal((current) => {
      if (!current) return current;
      const product = products.find((item) => item.id === current.productId);
      const nextEnteredQuantity = roundQuantity(Math.max(0, current.enteredQuantity + amount));
      const nextLine = { ...current, enteredQuantity: nextEnteredQuantity };
      if (toStockQuantity(nextLine, product) > (product?.quantity ?? 0)) return current;
      return nextLine;
    });
  }

  function setModalQuantity(enteredQuantity: number) {
    setQuantityModal((current) => {
      if (!current) return current;
      const product = products.find((item) => item.id === current.productId);
      const nextLine = { ...current, enteredQuantity: roundQuantity(Math.max(0, enteredQuantity)) };
      if (toStockQuantity(nextLine, product) > (product?.quantity ?? 0)) return current;
      return nextLine;
    });
  }

  function setModalUnit(enteredUnit: string) {
    setQuantityModal((current) => {
      if (!current) return current;
      const product = products.find((item) => item.id === current.productId);
      const nextLine = convertCartUnit(current, product, enteredUnit);
      if (toStockQuantity(nextLine, product) > (product?.quantity ?? 0)) return current;
      return nextLine;
    });
  }

  function confirmQuantityModal(nextLine = quantityModal) {
    if (!nextLine || nextLine.enteredQuantity <= 0) {
      setQuantityModal(null);
      return;
    }

    const product = products.find((item) => item.id === nextLine.productId);
    if (!product) return;

    const safeLine = clampLineToStock(nextLine, product);

    setCart((current) => {
      const exists = current.some((line) => line.productId === safeLine.productId);
      if (exists) {
        return current.map((line) => (line.productId === safeLine.productId ? safeLine : line));
      }

      return [...current, safeLine];
    });
    setQuantityModal(null);
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
    formData.set("status", "CONFIRMED");
    formData.set("tax", "0");
    formData.set("discount", String(discount));
    formData.set("deliveryArea", deliveryArea);
    formData.set("deliveryCharge", String(deliveryCharge));
    formData.set("costingAmount", "0");
    formData.set("paymentMethod", values.paymentMethod);
    formData.set("paidAmount", String(paidAmount));
    formData.set("note", "POS sale");
    formData.set("orderDate", new Date().toISOString());
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
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product or SKU"
              className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="relative w-full lg:w-auto">
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 lg:w-44"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const existingCartLine = cart.find((line) => line.productId === product.id);
            const availableQuantity = Math.max(0, product.quantity - (cartReservedStock[product.id] ?? 0));
            const isFullyReserved = availableQuantity <= 0;
            const isUnavailable = isFullyReserved && !existingCartLine;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleProductClick(product)}
                disabled={isUnavailable}
                className={isFullyReserved
                  ? `group relative flex min-h-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-left opacity-70 ${isUnavailable ? "cursor-not-allowed" : ""}`
                  : "group relative flex min-h-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"}
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="h-32 w-full shrink-0 border-b border-slate-100 bg-slate-50 object-cover" />
                ) : (
                  <span className="grid h-32 w-full shrink-0 place-items-center border-b border-emerald-100 bg-emerald-50 text-2xl font-black text-emerald-700">
                    {product.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="flex flex-col gap-2 p-2.5 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:p-3 sm:pb-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 sm:text-base">{product.name}</p>
                  </div>
                  <span className="w-fit max-w-full shrink-0 rounded-full bg-slate-50 px-2 py-1 text-center text-[10px] font-bold leading-tight text-slate-600 ring-1 ring-slate-200 sm:max-w-24">
                    {formatQuantity(availableQuantity, product.unit)}
                  </span>
                </div>
                <div className="mx-2.5 mb-2.5 mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-2.5 sm:mx-3 sm:mb-3 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-950 sm:text-lg">{formatCurrency(product.sellingPrice)}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{product.categoryName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={isUnavailable
                      ? "grid h-8 w-8 place-items-center rounded-md bg-slate-300 text-lg font-medium text-white sm:h-9 sm:w-9"
                      : "grid h-8 w-8 place-items-center rounded-md bg-slate-900 text-lg font-medium text-white transition group-hover:bg-emerald-700 sm:h-9 sm:w-9"}
                    >
                      +
                    </span>
                  </div>
                </div>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500 opacity-0 transition group-hover:opacity-100" />
              </button>
            );
          })}
          {filteredProducts.length === 0 ? <p className="col-span-full py-10 text-center text-sm text-stone-500">No matching products.</p> : null}
        </div>
      </section>

      <aside className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-md shadow-slate-900/[0.05] xl:sticky xl:top-24 xl:self-start">
        <div className="flex items-center justify-between bg-emerald-700 px-5 py-4 text-white">
          <div>
            <h2 className="font-semibold">Current sale</h2>
            <p className="text-xs text-white/50">{cartDetails.lines.length} items selected</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-md bg-white/15"><ShoppingBag className="text-white" size={19} /></span>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-4">
          {cartDetails.lines.map((line) => (
            <div key={line.productId} className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{line.product?.name}</p>
                  <p className="text-xs text-slate-500">
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
                    <label className="relative">
                      <select
                        value={line.enteredUnit}
                        onChange={(event) => setManualUnit(line.productId, event.target.value)}
                        className="h-9 appearance-none rounded-md border border-stone-200 bg-white pl-2.5 pr-8 text-sm"
                        aria-label="Sale unit"
                      >
                        <option value="kg">kg</option>
                        <option value="gm">gm</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-700" size={14} />
                    </label>
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
            <div className="relative">
              <Input
                label="Customer name or phone"
                placeholder="Start typing to find a customer"
                {...customerNameField}
                onChange={(event) => {
                  customerNameField.onChange(event);
                  setSelectedCustomerId(null);
                }}
                error={errors.customerName?.message}
              />
              {matchingCustomers.length ? (
                <div className="absolute inset-x-0 top-[76px] z-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Matching customers</p>
                  {matchingCustomers.map((customer) => (
                    <button key={customer.id} type="button" onClick={() => chooseCustomer(customer)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-emerald-50">
                      <span><span className="block text-sm font-semibold text-slate-950">{customer.name}</span><span className="block text-xs text-slate-500">{customer.phone || customer.email || "No contact"}</span></span>
                      <span className="text-xs font-semibold text-emerald-700">Use</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Phone"
                {...customerPhoneField}
                onChange={(event) => {
                  customerPhoneField.onChange(event);
                  setSelectedCustomerId(null);
                }}
                error={errors.customerPhone?.message}
              />
              <Select label="Payment" {...register("paymentMethod")} error={errors.paymentMethod?.message}>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{paymentMethodLabels[method]}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Discount" type="number" step="0.01" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
              <Input label="Amount" type="number" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(Number(event.target.value))} error={errors.paidAmount?.message} />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-950">
                <MapPin size={16} className="text-[#ff6b4a]" />
                Delivery charge
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[{ id: "NONE", label: "None", amount: 0 }, ...settings.deliveryOptions].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateDeliveryArea(option.id)}
                    className={deliveryArea === option.id
                      ? "min-h-10 rounded-md bg-slate-900 px-2 py-2 text-xs font-bold leading-tight text-white shadow-sm"
                      : "min-h-10 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold leading-tight text-slate-600 hover:border-emerald-300"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Input label="Delivery amount" type="number" step="0.01" value={deliveryCharge} onChange={(event) => setDeliveryCharge(Number(event.target.value))} className="mt-3" />
            </div>
          </div>
          <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span className="font-semibold">{formatCurrency(cartDetails.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Delivery</span><span className="font-semibold">{formatCurrency(deliveryCharge)}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Discount</span><span className="font-semibold">-{formatCurrency(discount)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg"><span className="font-bold text-slate-950">Total</span><span className="font-bold text-slate-950">{formatCurrency(cartDetails.total)}</span></div>
            <div className="flex justify-between text-emerald-700"><span className="font-semibold">Change</span><span className="font-bold">{formatCurrency(cartDetails.change)}</span></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LinkButton href="/orders" variant="secondary">Sales history</LinkButton>
            <Button disabled={pending || cart.length === 0}>{pending ? "Completing..." : "Complete sale"}</Button>
          </div>
        </div>
      </aside>
      {quantityModal ? (
        <QuantityModal
          line={quantityModal}
          product={products.find((item) => item.id === quantityModal.productId)}
          onClose={() => setQuantityModal(null)}
          onDecrease={() => changeModalQuantity(-1)}
          onIncrease={() => changeModalQuantity(1)}
          onQuantityChange={setModalQuantity}
          onUnitChange={setModalUnit}
          onConfirm={(line) => confirmQuantityModal(line)}
        />
      ) : null}
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}

function QuantityModal({
  line,
  product,
  onClose,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onUnitChange,
  onConfirm
}: {
  line: CartLine;
  product?: ProductOption;
  onClose: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onQuantityChange: (quantity: number) => void;
  onUnitChange: (unit: string) => void;
  onConfirm: (line: CartLine) => void;
}) {
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.left = originalStyles.left;
      document.body.style.right = originalStyles.right;
      document.body.style.width = originalStyles.width;
      document.body.style.overflow = originalStyles.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  if (!product) return null;

  const stockQuantity = toStockQuantity(line, product);
  const lineTotal = getSaleUnitPrice(product) * stockQuantity;

  if (typeof document === "undefined") return null;

  return createPortal((
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Close quantity modal" onClick={onClose} />
      <div className="absolute bottom-0 left-1/2 w-[min(calc(100dvw-24px),430px)] -translate-x-1/2 overflow-hidden rounded-t-3xl bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-2xl shadow-slate-950/30" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="h-16 w-16 shrink-0 rounded-2xl bg-slate-100 object-cover" />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-lg font-black text-emerald-700">
                {product.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 pt-1">
              <h3 className="line-clamp-2 text-base font-bold leading-5 text-slate-950">{product.name}</h3>
              <p className="mt-1 text-sm font-semibold text-emerald-700">{formatCurrency(product.sellingPrice)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 rounded-2xl bg-slate-50 p-3">
          <div className="grid grid-cols-[56px_minmax(0,1fr)_56px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button type="button" className="grid h-12 w-12 place-items-center text-slate-700" onClick={onDecrease} aria-label="Decrease quantity">
              <Minus size={18} />
            </button>
            <input
              type="number"
              min="0"
              step="0.001"
              value={line.enteredQuantity}
              onChange={(event) => onQuantityChange(Number(event.target.value))}
              className="h-12 min-w-0 border-x border-slate-200 text-center text-lg font-bold text-slate-950 outline-none"
              aria-label="Sale quantity"
            />
            <button type="button" className="grid h-12 w-12 place-items-center text-slate-700" onClick={onIncrease} aria-label="Increase quantity">
              <Plus size={18} />
            </button>
          </div>

          <div className="grid grid-cols-[88px_minmax(0,1fr)] items-stretch gap-3">
            {isKgProduct(product) ? (
              <label className="relative">
                <select
                  value={line.enteredUnit}
                  onChange={(event) => onUnitChange(event.target.value)}
                  className="h-full min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm font-semibold text-slate-800"
                  aria-label="Sale unit"
                >
                  <option value="kg">kg</option>
                  <option value="gm">gm</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-700" size={15} />
              </label>
            ) : (
              <span className="grid min-h-11 place-items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{product.unit}</span>
            )}
            <div className="min-w-0 rounded-xl bg-white px-3 py-2 text-right ring-1 ring-slate-200">
              <p className="truncate text-xs font-medium text-slate-500">Stock {formatQuantity(product.quantity, product.unit)}</p>
              <p className="truncate text-lg font-black text-slate-950">{formatCurrency(lineTotal)}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 h-12 w-full rounded-2xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition active:translate-y-px"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onConfirm(line);
          }}
        >
          Add to cart
        </button>
      </div>
    </div>
  ), document.body);
}

function clampLineToStock(line: CartLine, product: ProductOption): CartLine {
  const stockQuantity = toStockQuantity(line, product);
  if (stockQuantity <= product.quantity) return line;

  if (isKgProduct(product) && line.enteredUnit === "gm") {
    return { ...line, enteredQuantity: roundQuantity(product.quantity * 1000) };
  }

  return { ...line, enteredQuantity: roundQuantity(product.quantity) };
}
  function isKgProduct(product?: ProductOption) {
    const unit = product?.unit.toLowerCase();
    return unit === "kg" || unit === "kilogram";
  }

  function toStockQuantity(line: CartLine, product?: ProductOption) {
    if (!product) return 0;
    if (isKgProduct(product) && line.enteredUnit === "gm") {
      return roundQuantity(line.enteredQuantity / 1000);
    }
    return roundQuantity(line.enteredQuantity);
  }

  function formatSaleQuantity(line: CartLine, product?: ProductOption) {
    if (!product) return "";
    return `${roundQuantity(line.enteredQuantity)} ${line.enteredUnit || product.unit}`;
  }

  function getSaleUnitPrice(product?: ProductOption) {
    if (!product) return 0;
    const sellingPrice = Number(product.sellingPrice);

    if (product.baseQuantity > 0) {
      return sellingPrice / product.baseQuantity;
    }

    return sellingPrice;
  }

  function getInitialCartQuantity(product: ProductOption): Pick<CartLine, "enteredQuantity" | "enteredUnit"> {
    if (isKgProduct(product) && product.quantity < 1) {
      return { enteredQuantity: roundQuantity(product.quantity * 1000), enteredUnit: "gm" };
    }

    return { enteredQuantity: 1, enteredUnit: isKgProduct(product) ? "kg" : product.unit };
  }

  function convertCartUnit(line: CartLine, product: ProductOption | undefined, enteredUnit: string): CartLine {
    if (!isKgProduct(product)) {
      return { ...line, enteredUnit };
    }

    if (line.enteredUnit === "kg" && enteredUnit === "gm") {
      return { ...line, enteredQuantity: roundQuantity(line.enteredQuantity * 1000), enteredUnit };
    }

    if (line.enteredUnit === "gm" && enteredUnit === "kg") {
      return { ...line, enteredQuantity: roundQuantity(line.enteredQuantity / 1000), enteredUnit };
    }

    return { ...line, enteredUnit };
  }

  function roundQuantity(value: number) {
    return Number(value.toFixed(3));
  }
