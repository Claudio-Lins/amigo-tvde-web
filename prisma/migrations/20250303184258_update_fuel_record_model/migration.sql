/*
  Warnings:

  - You are about to drop the column `amount` on the `FuelRecord` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `FuelRecord` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `FuelRecord` table. All the data in the column will be lost.
  - You are about to drop the column `totalCost` on the `FuelRecord` table. All the data in the column will be lost.
  - Added the required column `fuelAmount` to the `FuelRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerUnit` to the `FuelRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `FuelRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "FuelRecord_weeklyPeriodId_idx";

-- AlterTable
ALTER TABLE "FuelRecord" ADD COLUMN "fuelAmount" DOUBLE PRECISION;
ALTER TABLE "FuelRecord" ADD COLUMN "pricePerUnit" DOUBLE PRECISION;
ALTER TABLE "FuelRecord" ADD COLUMN "totalPrice" DOUBLE PRECISION;
ALTER TABLE "FuelRecord" ADD COLUMN "chargingMethod" TEXT;

-- Preencher as novas colunas com dados das colunas antigas
UPDATE "FuelRecord" 
SET 
  "fuelAmount" = "amount",
  "pricePerUnit" = "price",
  "totalPrice" = "totalCost";

-- Remover as colunas antigas depois de migrar os dados
ALTER TABLE "FuelRecord" DROP COLUMN "amount";
ALTER TABLE "FuelRecord" DROP COLUMN "price";
ALTER TABLE "FuelRecord" DROP COLUMN "totalCost";
ALTER TABLE "FuelRecord" DROP COLUMN "location";

-- Tornar as novas colunas obrigatórias
ALTER TABLE "FuelRecord" ALTER COLUMN "fuelAmount" SET NOT NULL;
ALTER TABLE "FuelRecord" ALTER COLUMN "pricePerUnit" SET NOT NULL;
ALTER TABLE "FuelRecord" ALTER COLUMN "totalPrice" SET NOT NULL;
