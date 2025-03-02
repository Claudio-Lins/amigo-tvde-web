/*
  Warnings:

  - Added the required column `weeklyGoal` to the `WeeklyPeriod` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WeeklyPeriod" ADD COLUMN     "weeklyGoal" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false;
