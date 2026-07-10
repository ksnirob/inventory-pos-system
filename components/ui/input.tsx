import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  error?: string;
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & FieldProps;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps;

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-stone-700">
      {label}
      <input
        className={cn(
          "h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-stone-700">
      {label}
      <textarea
        className={cn(
          "min-h-24 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-stone-700">
      {label}
      <select
        className={cn(
          "h-11 rounded-md border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
