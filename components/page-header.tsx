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
    <div className="mb-6 flex flex-col gap-4 rounded-md border border-stone-200 bg-white p-5 shadow-sm shadow-stone-200/80 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-950">{title}</h1>
        {description ? <p className="mt-2 text-sm text-stone-500">{description}</p> : null}
      </div>
      {action ? (
        <LinkButton href={action.href}>
          {action.icon}
          {action.label}
        </LinkButton>
      ) : null}
    </div>
  );
}
