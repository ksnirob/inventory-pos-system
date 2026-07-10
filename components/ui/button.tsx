import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variants = {
  primary: "border border-emerald-700 bg-emerald-700 text-white shadow-sm shadow-emerald-900/10 hover:border-emerald-800 hover:bg-emerald-800",
  secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
  danger: "border border-rose-600 bg-rose-600 text-white shadow-sm hover:border-rose-700 hover:bg-rose-700",
  ghost: "border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
};

const base = "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

type LinkButtonProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonProps["variant"];
};

export function LinkButton({ className, variant = "primary", ...props }: LinkButtonProps) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
