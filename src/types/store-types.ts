import { FuelType } from "@prisma/client";

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
}

export interface VehicleType {
	id: string;
	make: string;
	model: string;
	year: number;
	fuelType: FuelType;
	userId: string;
}

export interface StoreState {
	users: User[];
	addUser: (user: User) => void;
	vehicles: VehicleType[];
	addVehicle: (vehicle: VehicleType) => void;
	removeVehicle: (id: string) => void;
	updateVehicle: (vehicle: VehicleType) => void;
}
