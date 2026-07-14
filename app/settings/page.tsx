import { SettingsForm } from "@/components/forms/settings-form";
import { PageHeader } from "@/components/page-header";
import { getBusinessSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <>
      <PageHeader title="Settings" description="Manage business identity, logo, and POS delivery charges." />
      <SettingsForm settings={settings} />
    </>
  );
}
