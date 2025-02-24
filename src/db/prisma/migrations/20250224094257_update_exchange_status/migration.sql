/*
  Warnings:

  - The values [waitingExchange] on the enum `ExchangeStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExchangeStatus_new" AS ENUM ('pending', 'approved');
ALTER TABLE "Exchange" ALTER COLUMN "status" TYPE "ExchangeStatus_new" USING ("status"::text::"ExchangeStatus_new");
ALTER TYPE "ExchangeStatus" RENAME TO "ExchangeStatus_old";
ALTER TYPE "ExchangeStatus_new" RENAME TO "ExchangeStatus";
DROP TYPE "ExchangeStatus_old";
COMMIT;
