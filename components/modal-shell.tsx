import Link from "next/link";
import { X } from "lucide-react";

export function ModalShell({
  title,
  description,
  closeHref,
  children
}: {
  title: string;
  description?: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-stone-950/45 px-4 py-10 backdrop-blur-sm sm:place-items-center">
      <Link href={closeHref} className="absolute inset-0" aria-label="Close modal" />
      <section className="relative w-full max-w-5xl overflow-hidden rounded-md border border-cyan-100 bg-white shadow-2xl shadow-stone-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-amber-50 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-stone-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
          </div>
          <Link href={closeHref} className="rounded-md p-2 text-stone-500 hover:bg-white" aria-label="Close">
            <X size={19} />
          </Link>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
