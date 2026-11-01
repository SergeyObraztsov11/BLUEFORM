-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('CONDITIONAL');

-- AlterTable
ALTER TABLE "orders"
  ADD COLUMN "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'CONDITIONAL',
  ADD COLUMN "adminComment" TEXT,
  ADD COLUMN "trackingNumber" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_phone_idx" ON "orders"("phone");
