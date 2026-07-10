import { LinkButton } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string; icon?: React.ReactNode };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff6b4a]" /><span className="h-2 w-8 rounded-full bg-emerald-400" /></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[30px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <LinkButton href={action.href}>{action.icon}{action.label}</LinkButton> : null}
    </div>
  );
}
