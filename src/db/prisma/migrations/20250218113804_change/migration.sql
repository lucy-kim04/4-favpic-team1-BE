/*
  Warnings:

  - You are about to drop the column `cardId` on the `CardEdition` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeId` on the `CardEdition` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseId` on the `CardEdition` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `CardEdition` table. All the data in the column will be lost.
  - You are about to drop the `Exchange` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CardEdition" DROP CONSTRAINT "CardEdition_cardId_fkey";

-- DropForeignKey
ALTER TABLE "CardEdition" DROP CONSTRAINT "CardEdition_exchangeId_fkey";

-- DropForeignKey
ALTER TABLE "CardEdition" DROP CONSTRAINT "CardEdition_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "CardEdition" DROP CONSTRAINT "CardEdition_shopId_fkey";

-- DropForeignKey
ALTER TABLE "Exchange" DROP CONSTRAINT "Exchange_proposerId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_userId_fkey";

-- DropIndex
DROP INDEX "CardEdition_exchangeId_key";

-- AlterTable
ALTER TABLE "CardEdition" DROP COLUMN "cardId",
DROP COLUMN "exchangeId",
DROP COLUMN "purchaseId",
DROP COLUMN "shopId";

-- DropTable
DROP TABLE "Exchange";

-- DropTable
DROP TABLE "Purchase";

-- DropTable
DROP TABLE "Shop";

-- DropEnum
DROP TYPE "ExchangeStatus";
