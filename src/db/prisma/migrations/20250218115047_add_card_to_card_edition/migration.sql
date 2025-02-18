/*
  Warnings:

  - Added the required column `cardId` to the `CardEdition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CardEdition" ADD COLUMN     "cardId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CardEdition" ADD CONSTRAINT "CardEdition_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
