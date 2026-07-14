import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { logoData: true, logoMimeType: true, updatedAt: true }
  });

  if (!settings?.logoData || !settings.logoMimeType) {
    return new NextResponse("Logo not found", { status: 404 });
  }

  return new NextResponse(Uint8Array.from(settings.logoData), {
    headers: {
      "Content-Type": settings.logoMimeType,
      "Cache-Control": "no-store, max-age=0",
      "Last-Modified": settings.updatedAt.toUTCString()
    }
  });
}
