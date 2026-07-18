import { LoginForm } from "@/components/forms/login-form";
import { getBusinessSettings } from "@/lib/settings";

export default async function LoginPage() {
  const settings = await getBusinessSettings();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
        <div className="mb-6 text-center">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.systemName} className="mx-auto mb-3 h-14 w-14 rounded-md object-contain" />
          ) : null}
          <h1 className="text-2xl font-black text-slate-950">{settings.systemName}</h1>
          <p className="mt-1 text-sm text-slate-500">{settings.systemTagline}</p>
        </div>
        <LoginForm />
        {/* <p className="mt-4 text-center text-xs text-slate-400">Default login: admin / admin123</p> */}
      </section>
    </main>
  );
}
