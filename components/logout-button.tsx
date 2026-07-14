"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={cn(
          "flex h-10 items-center gap-3 rounded-md text-[13px] font-semibold transition",
          compact
            ? "border border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
            : "w-full px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-950"
        )}
      >
        <LogOut size={18} className="text-slate-400" />
        <span>Logout</span>
      </button>
    </form>
  );
}
