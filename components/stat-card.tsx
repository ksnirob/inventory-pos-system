import type { LucideIcon } from "lucide-react";

const palettes = [
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-orange-50 text-[#e45232] ring-orange-100",
  "bg-amber-50 text-amber-700 ring-amber-100",
  "bg-sky-50 text-sky-700 ring-sky-100",
  "bg-violet-50 text-violet-700 ring-violet-100"
];

export function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  const palette = palettes[label.length % palettes.length];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${palette}`}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-950 opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}
