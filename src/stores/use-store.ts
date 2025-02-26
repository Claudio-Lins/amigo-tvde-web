import { StoreState } from "@/types/store-types";
import { create } from "zustand";
const useStore = create<StoreState>((set) => ({
	vehicles: [],
	addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
	removeVehicle: (id) => set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) })),
	updateVehicle: (vehicle) =>
		set((state) => ({
			vehicles: state.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)),
		})),
	users: [],
	addUser: (user) => set((state) => ({ users: [...state.users, user] })),
	vehicleTVDECategories: [],
}));

export default useStore;
