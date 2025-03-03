-- CreateTable
CREATE TABLE "FuelRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "odometer" DOUBLE PRECISION NOT NULL,
    "fullTank" BOOLEAN NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyPeriodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuelRecord_vehicleId_idx" ON "FuelRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelRecord_userId_idx" ON "FuelRecord"("userId");

-- CreateIndex
CREATE INDEX "FuelRecord_weeklyPeriodId_idx" ON "FuelRecord"("weeklyPeriodId");

-- AddForeignKey
ALTER TABLE "FuelRecord" ADD CONSTRAINT "FuelRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRecord" ADD CONSTRAINT "FuelRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRecord" ADD CONSTRAINT "FuelRecord_weeklyPeriodId_fkey" FOREIGN KEY ("weeklyPeriodId") REFERENCES "WeeklyPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
