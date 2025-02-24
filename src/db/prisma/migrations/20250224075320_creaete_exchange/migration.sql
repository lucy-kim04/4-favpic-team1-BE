/*
  Warnings:

  - A unique constraint covering the columns `[exchangeId]` on the table `Card` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[exchangeId]` on the table `CardEdition` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('pending', 'approved');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "exchangeId" TEXT;

-- AlterTable
ALTER TABLE "CardEdition" ADD COLUMN     "exchangeId" TEXT;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "exchangeStatus" "ExchangeStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_exchangeId_key" ON "Card"("exchangeId");

-- CreateIndex
CREATE UNIQUE INDEX "CardEdition_exchangeId_key" ON "CardEdition"("exchangeId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardEdition" ADD CONSTRAINT "CardEdition_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
