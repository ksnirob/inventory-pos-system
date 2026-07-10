import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="group rounded-md border border-stone-200 bg-white p-5 shadow-sm shadow-stone-200/80 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <span className="grid h-10 w-10 place-items-center rounded-md bg-stone-100 text-stone-700 transition group-hover:bg-stone-900 group-hover:text-white">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-stone-950">{value}</p>
    </div>
  );
}
