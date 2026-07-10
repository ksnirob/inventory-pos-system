"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/inventory";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { orderStatuses } from "@/types/inventory";

export function OrderStatusForm({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, formData);
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) router.refresh();
    });
  }

  return (
    <form action={submit} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5 text-sm font-medium text-stone-700">
        Update status
        <span className="relative">
          <select name="status" defaultValue={status} className="h-10 w-full appearance-none rounded-md border border-stone-200 bg-white pl-3 pr-12 text-sm">
            {orderStatuses.map((item) => (
              <option key={item} value={item}>{item.replace("_", " ")}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-900" size={17} />
        </span>
      </label>
      <Button disabled={pending} className="h-10">{pending ? "Saving..." : "Save"}</Button>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
