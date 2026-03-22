/*
  Warnings:

  - A unique constraint covering the columns `[stripeEventId]` on the table `PurchasedIdea` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PurchasedIdea" ADD COLUMN     "stripeEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedIdea_stripeEventId_key" ON "PurchasedIdea"("stripeEventId");

-- CreateIndex
CREATE INDEX "PurchasedIdea_stripeEventId_idx" ON "PurchasedIdea"("stripeEventId");
