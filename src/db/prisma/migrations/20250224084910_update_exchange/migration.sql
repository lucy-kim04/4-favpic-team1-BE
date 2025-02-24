/*
  Warnings:

  - The values [approved] on the enum `ExchangeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `exchangeId` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeStatus` on the `Exchange` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `Exchange` table. All the data in the column will be lost.
  - Added the required column `shopId` to the `Exchange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Exchange` table without a default value. This is not possible if the table is not empty.

*/
ALTER TABLE "Exchange" DROP COLUMN "exchangeStatus";
-- AlterEnum
BEGIN;
CREATE TYPE "ExchangeStatus_new" AS ENUM ('pending', 'waitingExchange');
ALTER TYPE "ExchangeStatus" RENAME TO "ExchangeStatus_old";
ALTER TYPE "ExchangeStatus_new" RENAME TO "ExchangeStatus";
DROP TYPE "ExchangeStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Card" DROP CONSTRAINT "Card_exchangeId_fkey";

-- DropIndex
DROP INDEX "Card_exchangeId_key";

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "exchangeId";

-- AlterTable
ALTER TABLE "Exchange" 
DROP COLUMN "sellerId",
ADD COLUMN     "shopId" TEXT NOT NULL,
ADD COLUMN     "status" "ExchangeStatus" NOT NULL;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
