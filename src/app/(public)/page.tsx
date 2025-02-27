import { AddVehicleForm } from "@/components/vehicle/add-vehicle-form";
import { checkUser } from "@/lib/check-user";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
	const user = await checkUser();

	if (user) {
		redirect("/dashboard");
	}

	return (
		<div className="w-full h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
			<h1 className="text-4xl font-bold">Welcome to the app</h1>
			<Link href="/sign-in">Sign in</Link>
		</div>
	);
}
