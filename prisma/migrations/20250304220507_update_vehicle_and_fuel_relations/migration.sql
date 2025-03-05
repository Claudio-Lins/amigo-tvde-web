/*
  Warnings:

  - You are about to drop the column `make` on the `Vehicle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shiftExpenseId]` on the table `FuelRecord` will be added. If there are existing duplicate values, this will fail.
  - Made the column `shiftId` on table `FuelRecord` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `ShiftExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FuelRecord" DROP CONSTRAINT "FuelRecord_shiftId_fkey";

-- DropIndex
DROP INDEX "FuelRecord_weeklyPeriodId_idx";

-- AlterTable
ALTER TABLE "FuelRecord" ADD COLUMN     "shiftExpenseId" TEXT,
ALTER COLUMN "shiftId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ShiftExpense" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "make",
ADD COLUMN     "brand" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FuelRecord_shiftExpenseId_key" ON "FuelRecord"("shiftExpenseId");

-- AddForeignKey
ALTER TABLE "ShiftExpense" ADD CONSTRAINT "ShiftExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRecord" ADD CONSTRAINT "FuelRecord_shiftExpenseId_fkey" FOREIGN KEY ("shiftExpenseId") REFERENCES "ShiftExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRecord" ADD CONSTRAINT "FuelRecord_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
