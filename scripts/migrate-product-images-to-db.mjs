import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const mimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

try {
  const products = await prisma.product.findMany({
    where: {
      imageUrl: { startsWith: "/uploads/" },
      imageData: null
    },
    select: {
      id: true,
      imageUrl: true
    }
  });

  let migrated = 0;
  for (const product of products) {
    if (!product.imageUrl) continue;

    const relativePath = product.imageUrl.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", relativePath);

    try {
      const imageData = await readFile(filePath);
      const imageMimeType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";

      await prisma.product.update({
        where: { id: product.id },
        data: {
          imageData,
          imageMimeType
        }
      });

      migrated += 1;
    } catch {
      console.warn(`Skipped missing image: ${product.imageUrl}`);
    }
  }

  console.log(`Migrated product images: ${migrated}`);
} finally {
  await prisma.$disconnect();
}
