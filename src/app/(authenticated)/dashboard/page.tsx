import { AddVehicleForm } from "@/components/vehicle/add-vehicle-form";

export default function Dashboard() {
	return (
		<div className="w-full h-dvh flex flex-col gap-4 px-4 items-center max-w-2xl mx-auto bg-amber-400 pt-20">
			<h1 className="text-4xl font-bold">Dashboard</h1>
			<AddVehicleForm />
		</div>
	);
}
