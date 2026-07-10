-- SQLite stores numeric values dynamically, so existing INTEGER quantity columns
-- can safely contain decimal values. This migration records the Prisma schema
-- change and adds POS display fields for invoice lines.
ALTER TABLE "OrderItem" ADD COLUMN "enteredQuantity" DECIMAL;
ALTER TABLE "OrderItem" ADD COLUMN "enteredUnit" TEXT;
