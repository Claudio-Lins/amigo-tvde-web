-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "extendedEndTime" TIMESTAMP(3),
ADD COLUMN     "weeklyPeriodId" TEXT;

-- AlterTable
ALTER TABLE "ShiftIncome" ADD COLUMN     "isExtendedHour" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WeeklyPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPeriod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WeeklyPeriod" ADD CONSTRAINT "WeeklyPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_weeklyPeriodId_fkey" FOREIGN KEY ("weeklyPeriodId") REFERENCES "WeeklyPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
