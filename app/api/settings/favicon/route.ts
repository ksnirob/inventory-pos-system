import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { faviconData: true, faviconMimeType: true, logoData: true, logoMimeType: true, updatedAt: true }
  });

  if (!settings) {
    return new NextResponse("Favicon not found", { status: 404 });
  }

  const data = settings.faviconData ?? settings.logoData;
  const mimeType = settings.faviconMimeType ?? settings.logoMimeType;

  if (!data || !mimeType) {
    return new NextResponse("Favicon not found", { status: 404 });
  }

  return new NextResponse(Uint8Array.from(data), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "no-store, max-age=0",
      "Last-Modified": settings.updatedAt.toUTCString()
    }
  });
}
