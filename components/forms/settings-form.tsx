"use client";

import { ImageUp, LockKeyhole, Plus, Store, Trash2, Truck, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { saveBusinessSettings } from "@/actions/inventory";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RuntimeSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: RuntimeSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState(settings.deliveryOptions);
  const displayedLogoUrl = removeLogo ? null : logoPreviewUrl ?? settings.logoUrl;
  const displayedFaviconUrl = removeFavicon ? null : faviconPreviewUrl ?? settings.faviconUrl ?? settings.logoUrl;

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      if (faviconPreviewUrl) URL.revokeObjectURL(faviconPreviewUrl);
    };
  }, [faviconPreviewUrl, logoPreviewUrl]);

  function onLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
      return;
    }

    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoPreviewUrl(URL.createObjectURL(file));
    setRemoveLogo(false);
  }

  function onFaviconChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      if (faviconPreviewUrl) URL.revokeObjectURL(faviconPreviewUrl);
      setFaviconPreviewUrl(null);
      return;
    }

    if (faviconPreviewUrl) URL.revokeObjectURL(faviconPreviewUrl);
    setFaviconPreviewUrl(URL.createObjectURL(file));
    setRemoveFavicon(false);
  }

  function addDeliveryOption() {
    setDeliveryOptions((current) => [
      ...current,
      { id: `DELIVERY_${Date.now()}`, label: "New option", amount: 0 }
    ]);
  }

  function updateDeliveryOption(index: number, key: "label" | "amount", value: string) {
    setDeliveryOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, [key]: key === "amount" ? Number(value) : value }
          : option
      )
    );
  }

  function removeDeliveryOption(index: number) {
    setDeliveryOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveBusinessSettings(formData);
      setErrors(Object.fromEntries(Object.entries(result.fieldErrors ?? {}).map(([key, value]) => [key, value?.[0]])));
      setToast({ message: result.message, type: result.ok ? "success" : "error" });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] lg:grid-cols-[360px_1fr]">
        <SettingsSection icon={ImageUp} title="Logo">
          <div className="grid gap-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="grid min-h-44 place-items-center rounded-md bg-white p-5">
              {displayedLogoUrl ? (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayedLogoUrl} alt={settings.systemName} className="mx-auto max-h-24 max-w-56 object-contain" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">{settings.systemTagline}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xl font-black text-slate-950">{settings.systemName}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{settings.systemTagline}</p>
                </div>
              )}
            </div>
            <Input name="logo" label="Upload logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="pt-2.5" onChange={onLogoChange} />
            {settings.hasLogo ? (
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input
                  name="removeLogo"
                  type="checkbox"
                  checked={removeLogo}
                  onChange={(event) => setRemoveLogo(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                />
                Remove current logo
              </label>
            ) : null}
            <p className="text-xs text-slate-500">JPG, PNG, WEBP, or SVG. Maximum 1MB.</p>

            <div className="border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Favicon</p>
                  <p className="text-xs text-slate-500">Browser tab icon. Uses logo if empty.</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-md border border-slate-200 bg-white">
                  {displayedFaviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayedFaviconUrl} alt="Favicon preview" className="max-h-8 max-w-8 object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">ICO</span>
                  )}
                </div>
              </div>
              <Input name="favicon" label="Upload favicon" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico" className="pt-2.5" onChange={onFaviconChange} />
              {settings.hasFavicon ? (
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input
                    name="removeFavicon"
                    type="checkbox"
                    checked={removeFavicon}
                    onChange={(event) => setRemoveFavicon(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  Remove current favicon
                </label>
              ) : null}
            </div>
          </div>
        </SettingsSection>

        <div className="grid gap-5">
          <SettingsSection icon={Store} title="Business profile">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input name="systemName" label="Business name" defaultValue={settings.systemName} error={errors.systemName} />
              <Input name="systemTagline" label="Tagline" defaultValue={settings.systemTagline} error={errors.systemTagline} />
            </div>
          </SettingsSection>

          <SettingsSection icon={Truck} title="Delivery charges">
            <div className="grid gap-3">
              {deliveryOptions.map((option, index) => (
                <div key={option.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_140px_40px] sm:items-end">
                  <input type="hidden" name="deliveryOptionId" value={option.id} />
                  <Input
                    name="deliveryOptionLabel"
                    label={index === 0 ? "Option label" : "Label"}
                    value={option.label}
                    onChange={(event) => updateDeliveryOption(index, "label", event.target.value)}
                  />
                  <Input
                    name="deliveryOptionAmount"
                    label={index === 0 ? "Charge" : "Amount"}
                    type="number"
                    step="0.01"
                    value={option.amount}
                    onChange={(event) => updateDeliveryOption(index, "amount", event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeDeliveryOption(index)}
                    disabled={deliveryOptions.length === 1}
                    className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Remove delivery option"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {errors.deliveryOptions ? <p className="text-xs font-medium text-rose-600">{errors.deliveryOptions}</p> : null}
              <button
                type="button"
                onClick={addDeliveryOption}
                className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
              >
                <Plus size={16} />
                Add delivery option
              </button>
            </div>
          </SettingsSection>

          <SettingsSection icon={LockKeyhole} title="Login security">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input name="adminUsername" label="Login username" defaultValue={settings.adminUsername} error={errors.adminUsername} />
              <Input name="adminPassword" label="New password" type="password" placeholder="Leave blank to keep current password" error={errors.adminPassword} />
            </div>
          </SettingsSection>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-[1540px] justify-end">
          <Button disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>
        </div>
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </form>
  );
}

function SettingsSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-100 text-emerald-700">
          <Icon size={18} />
        </span>
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
