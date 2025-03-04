-- AlterTable
ALTER TABLE "FuelRecord" ADD COLUMN     "shiftId" TEXT;

-- CreateIndex
CREATE INDEX "FuelRecord_weeklyPeriodId_idx" ON "FuelRecord"("weeklyPeriodId");

-- CreateIndex
CREATE INDEX "FuelRecord_shiftId_idx" ON "FuelRecord"("shiftId");

-- AddForeignKey
ALTER TABLE "FuelRecord" ADD CONSTRAINT "FuelRecord_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
