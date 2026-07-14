import { appConfig } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

export type RuntimeSettings = {
  systemName: string;
  systemTagline: string;
  deliveryCharges: {
    dhaka: number;
    outsideDhaka: number;
  };
  deliveryOptions: DeliveryOption[];
  logoUrl: string | null;
  hasLogo: boolean;
  faviconUrl: string | null;
  hasFavicon: boolean;
  adminUsername: string;
};

export type DeliveryOption = {
  id: string;
  label: string;
  amount: number;
};

function defaultDeliveryOptions(dhaka: number, outsideDhaka: number): DeliveryOption[] {
  return [
    { id: "DHAKA", label: "Inside Dhaka", amount: dhaka },
    { id: "OUTSIDE_DHAKA", label: "Outside Dhaka", amount: outsideDhaka }
  ];
}

function parseDeliveryOptions(value: string | null, dhaka: number, outsideDhaka: number): DeliveryOption[] {
  if (!value) return defaultDeliveryOptions(dhaka, outsideDhaka);

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return defaultDeliveryOptions(dhaka, outsideDhaka);

    const options = parsed
      .map((option) => ({
        id: typeof option?.id === "string" ? option.id : "",
        label: typeof option?.label === "string" ? option.label : "",
        amount: Number(option?.amount)
      }))
      .filter((option) => option.id && option.label && Number.isFinite(option.amount) && option.amount >= 0);

    return options.length ? options : defaultDeliveryOptions(dhaka, outsideDhaka);
  } catch {
    return defaultDeliveryOptions(dhaka, outsideDhaka);
  }
}

function getDefaultBusinessSettings(): RuntimeSettings {
  const dhaka = appConfig.deliveryCharges.dhaka;
  const outsideDhaka = appConfig.deliveryCharges.outsideDhaka;

  return {
    systemName: appConfig.systemName,
    systemTagline: appConfig.systemTagline,
    adminUsername: "admin",
    deliveryCharges: {
      dhaka,
      outsideDhaka
    },
    deliveryOptions: defaultDeliveryOptions(dhaka, outsideDhaka),
    logoUrl: null,
    hasLogo: false,
    faviconUrl: null,
    hasFavicon: false
  };
}

export async function getBusinessSettings(): Promise<RuntimeSettings> {
  if (!process.env.DATABASE_URL) {
    return getDefaultBusinessSettings();
  }

  const settings = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      systemName: appConfig.systemName,
      systemTagline: appConfig.systemTagline,
      deliveryChargeDhaka: appConfig.deliveryCharges.dhaka,
      deliveryChargeOutsideDhaka: appConfig.deliveryCharges.outsideDhaka
    }
  });

  const dhaka = Number(settings.deliveryChargeDhaka);
  const outsideDhaka = Number(settings.deliveryChargeOutsideDhaka);

  return {
    systemName: settings.systemName,
    systemTagline: settings.systemTagline,
    adminUsername: settings.adminUsername,
    deliveryCharges: {
      dhaka,
      outsideDhaka
    },
    deliveryOptions: parseDeliveryOptions(settings.deliveryOptionsJson, dhaka, outsideDhaka),
    logoUrl: settings.logoMimeType ? `/api/settings/logo?v=${settings.updatedAt.getTime()}` : null,
    hasLogo: Boolean(settings.logoMimeType),
    faviconUrl: settings.faviconMimeType ? `/api/settings/favicon?v=${settings.updatedAt.getTime()}` : null,
    hasFavicon: Boolean(settings.faviconMimeType)
  };
}
