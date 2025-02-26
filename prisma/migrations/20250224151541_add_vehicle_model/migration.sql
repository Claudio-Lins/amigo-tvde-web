/*
  Warnings:

  - You are about to drop the column `categories` on the `Vehicle` table. All the data in the column will be lost.
  - Changed the type of `fuelType` on the `Vehicle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'ELECTRIC', 'HYBRID', 'DIESEL');

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "categories",
DROP COLUMN "fuelType",
ADD COLUMN     "fuelType" "FuelType" NOT NULL;

-- CreateTable
CREATE TABLE "VehicleTVDECategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleTVDECategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VehicleToVehicleTVDECategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VehicleToVehicleTVDECategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleTVDECategory_name_key" ON "VehicleTVDECategory"("name");

-- CreateIndex
CREATE INDEX "_VehicleToVehicleTVDECategory_B_index" ON "_VehicleToVehicleTVDECategory"("B");

-- AddForeignKey
ALTER TABLE "_VehicleToVehicleTVDECategory" ADD CONSTRAINT "_VehicleToVehicleTVDECategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VehicleToVehicleTVDECategory" ADD CONSTRAINT "_VehicleToVehicleTVDECategory_B_fkey" FOREIGN KEY ("B") REFERENCES "VehicleTVDECategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
