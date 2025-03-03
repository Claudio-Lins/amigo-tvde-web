-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "breakMinutes" INTEGER,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3);
