function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const appConfig = {
  systemName: process.env.NEXT_PUBLIC_SYSTEM_NAME || "HashtagPlants",
  systemTagline: process.env.NEXT_PUBLIC_SYSTEM_TAGLINE || "Retail operations",
  deliveryCharges: {
    dhaka: readNumber(process.env.NEXT_PUBLIC_DELIVERY_CHARGE_DHAKA, 60),
    outsideDhaka: readNumber(process.env.NEXT_PUBLIC_DELIVERY_CHARGE_OUTSIDE_DHAKA, 120)
  }
};
