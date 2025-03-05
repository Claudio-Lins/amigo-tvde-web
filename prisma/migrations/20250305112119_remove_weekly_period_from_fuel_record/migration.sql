/*
  Warnings:

  - You are about to drop the column `weeklyPeriodId` on the `FuelRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FuelRecord" DROP CONSTRAINT "FuelRecord_weeklyPeriodId_fkey";

-- AlterTable
ALTER TABLE "FuelRecord" DROP COLUMN "weeklyPeriodId";
