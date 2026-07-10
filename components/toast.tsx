"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({ message, type }: { message?: string; type?: "success" | "error" }) {
  const [dismissedMessage, setDismissedMessage] = useState<string>();

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setDismissedMessage(message), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message || dismissedMessage === message) {
    return null;
  }

  const Icon = type === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-lg",
        type === "success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"
      )}
      role="status"
    >
      <Icon size={18} />
      {message}
    </div>
  );
}
