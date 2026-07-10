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
    <div className="group rounded-md border border-cyan-100 bg-gradient-to-br from-white via-white to-cyan-50/70 p-5 shadow-sm shadow-cyan-100/80 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-100">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <span className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-cyan-600 to-amber-400 text-white shadow-sm shadow-cyan-100 transition group-hover:scale-105">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-stone-950">{value}</p>
    </div>
  );
}
