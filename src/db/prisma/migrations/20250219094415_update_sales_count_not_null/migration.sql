/*
  Warnings:

  - Made the column `salesCount` on table `Shop` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "salesCount" SET NOT NULL,
ALTER COLUMN "salesCount" SET DEFAULT 0;
