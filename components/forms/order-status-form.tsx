"use client";

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
        <select name="status" defaultValue={status} className="h-10 rounded-md border border-stone-200 bg-white px-3 text-sm">
          {orderStatuses.map((item) => (
            <option key={item} value={item}>{item.replace("_", " ")}</option>
          ))}
        </select>
      </label>
      <Button disabled={pending} className="h-10">{pending ? "Saving..." : "Save"}</Button>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}
