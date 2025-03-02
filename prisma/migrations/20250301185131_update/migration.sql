-- CreateEnum
CREATE TYPE "VehicleOwnership" AS ENUM ('OWNED', 'RENTED', 'COMMISSION');

-- AlterEnum
ALTER TYPE "ExpenseCategory" ADD VALUE 'RENT';

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "commissionRate" DOUBLE PRECISION,
ADD COLUMN     "licensePlate" TEXT,
ADD COLUMN     "ownership" "VehicleOwnership" NOT NULL DEFAULT 'OWNED',
ADD COLUMN     "weeklyRent" DOUBLE PRECISION;
