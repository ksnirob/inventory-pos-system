import { PackageOpen } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
      <PackageOpen className="mb-3 text-slate-400" size={36} />
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}
