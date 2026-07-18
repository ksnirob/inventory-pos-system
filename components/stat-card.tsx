import { HelpCircle, type LucideIcon } from "lucide-react";

const palettes = [
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-orange-50 text-[#e45232] ring-orange-100",
  "bg-amber-50 text-amber-700 ring-amber-100",
  "bg-sky-50 text-sky-700 ring-sky-100",
  "bg-violet-50 text-violet-700 ring-violet-100"
];

export function StatCard({ label, value, icon: Icon, tooltip }: { label: string; value: string | number; icon: LucideIcon; tooltip?: string }) {
  const palette = palettes[label.length % palettes.length];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[12px] font-semibold text-slate-500">{label}</p>
            {tooltip ? (
              <span className="relative inline-flex">
                <HelpCircle tabIndex={0} className="peer cursor-help text-slate-400 outline-none transition hover:text-slate-700 focus:text-slate-700" size={14} aria-label={`${label} calculation`} />
                <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-64 -translate-x-1/2 rounded-md border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-medium leading-5 text-white shadow-xl peer-hover:block peer-focus:block">
                  {tooltip}
                </span>
              </span>
            ) : null}
          </div>
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
