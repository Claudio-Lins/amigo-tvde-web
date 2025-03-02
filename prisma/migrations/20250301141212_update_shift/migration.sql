/*
  Warnings:

  - You are about to drop the column `endMileage` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `extendedEndTime` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `startMileage` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Shift` table. All the data in the column will be lost.
  - Added the required column `date` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `odometer` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "endMileage",
DROP COLUMN "endTime",
DROP COLUMN "extendedEndTime",
DROP COLUMN "startMileage",
DROP COLUMN "startTime",
DROP COLUMN "type",
ADD COLUMN     "boltEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "odometer" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "uberEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "shiftId" TEXT,
    "weeklyPeriodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_shiftId_idx" ON "Expense"("shiftId");

-- CreateIndex
CREATE INDEX "Expense_weeklyPeriodId_idx" ON "Expense"("weeklyPeriodId");

-- CreateIndex
CREATE INDEX "Shift_userId_idx" ON "Shift"("userId");

-- CreateIndex
CREATE INDEX "Shift_vehicleId_idx" ON "Shift"("vehicleId");

-- CreateIndex
CREATE INDEX "Shift_weeklyPeriodId_idx" ON "Shift"("weeklyPeriodId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_weeklyPeriodId_fkey" FOREIGN KEY ("weeklyPeriodId") REFERENCES "WeeklyPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
