import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      imageData: true,
      imageMimeType: true
    }
  });

  if (!product?.imageData || !product.imageMimeType) {
    return new NextResponse(null, { status: 404 });
  }

  const imageData = Uint8Array.from(product.imageData).buffer;

  return new NextResponse(imageData, {
    headers: {
      "Content-Type": product.imageMimeType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
