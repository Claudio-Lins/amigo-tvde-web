/*
  Warnings:

  - You are about to drop the `VehicleTVDECategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_VehicleToVehicleTVDECategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_VehicleToVehicleTVDECategory" DROP CONSTRAINT "_VehicleToVehicleTVDECategory_A_fkey";

-- DropForeignKey
ALTER TABLE "_VehicleToVehicleTVDECategory" DROP CONSTRAINT "_VehicleToVehicleTVDECategory_B_fkey";

-- DropTable
DROP TABLE "VehicleTVDECategory";

-- DropTable
DROP TABLE "_VehicleToVehicleTVDECategory";
