import { cn } from "@/lib/utils";

type FieldProps = { label: string; error?: string };
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & FieldProps;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps;

const labelClass = "grid gap-1.5 text-[13px] font-semibold text-slate-700";
const fieldClass = "rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className={labelClass}>
      {label}
      <input className={cn("h-11", fieldClass, className)} {...props} />
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className={labelClass}>
      {label}
      <textarea className={cn("min-h-24 py-2.5", fieldClass, className)} {...props} />
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <label className={labelClass}>
      {label}
      <select className={cn("h-11", fieldClass, className)} {...props}>{children}</select>
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
