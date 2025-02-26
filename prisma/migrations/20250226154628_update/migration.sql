/*
  Warnings:

  - Made the column `monthlyNetIncome` on table `UserGoal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserGoal" ALTER COLUMN "weeklyNetIncome" DROP NOT NULL,
ALTER COLUMN "monthlyNetIncome" SET NOT NULL;
