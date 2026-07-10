"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionState } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/toast";

export function DeleteButton({
  action,
  label = "Delete",
  confirmMessage = "Are you sure you want to delete this record?"
}: {
  action: () => Promise<ActionState>;
  label?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();

  function onDelete() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      const result = await action();
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button type="button" variant="danger" className="h-9 px-3" disabled={pending} onClick={onDelete}>
        <Trash2 size={15} />
        {pending ? "Deleting..." : label}
      </Button>
      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}
