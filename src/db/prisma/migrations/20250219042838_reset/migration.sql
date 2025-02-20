/*
  Warnings:

  - Added the required column `exchangeDesc` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exchangeGenre` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exchangeGrade` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CardEdition" DROP CONSTRAINT "CardEdition_shopId_fkey";

-- AlterTable
ALTER TABLE "CardEdition" ALTER COLUMN "shopId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "exchangeDesc" TEXT NOT NULL,
ADD COLUMN     "exchangeGenre" TEXT NOT NULL,
ADD COLUMN     "exchangeGrade" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CardEdition" ADD CONSTRAINT "CardEdition_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
