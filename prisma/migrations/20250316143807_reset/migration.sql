/*
  Warnings:

  - Added the required column `category` to the `FixedExpense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PersonalExpenseType" AS ENUM ('RENT', 'UTILITIES', 'INTERNET', 'LOAN', 'INSURANCE', 'EDUCATION', 'HEALTHCARE', 'GROCERIES', 'LEISURE', 'CLOTHING', 'OTHER');

-- AlterTable
ALTER TABLE "FixedExpense" ADD COLUMN     "category" "PersonalExpenseType" NOT NULL,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MealExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "shiftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealExpense_userId_idx" ON "MealExpense"("userId");

-- CreateIndex
CREATE INDEX "MealExpense_shiftId_idx" ON "MealExpense"("shiftId");

-- AddForeignKey
ALTER TABLE "MealExpense" ADD CONSTRAINT "MealExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealExpense" ADD CONSTRAINT "MealExpense_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
