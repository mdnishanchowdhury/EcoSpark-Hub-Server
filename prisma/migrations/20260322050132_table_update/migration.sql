/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `PurchasedIdea` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `PurchasedIdea` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `PurchasedIdea` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PurchasedIdea` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "PurchasedIdea" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "paymentGatewayData" JSONB,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transactionId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedIdea_transactionId_key" ON "PurchasedIdea"("transactionId");

-- CreateIndex
CREATE INDEX "PurchasedIdea_transactionId_idx" ON "PurchasedIdea"("transactionId");
