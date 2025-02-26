"use client";

import { addVehicle } from "@/actions/vehicle-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { vehicleMakes } from "@/constant/vehicle-data";
import { VehicleFormData, vehicleSchema } from "@/schemas";
import useStore from "@/stores/use-store";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FuelType, User } from "@prisma/client";
import { Car, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function AddVehicleForm() {
	const [user, setUser] = useState<User | null>(null);
	const [selectedMake, setSelectedMake] = useState<string>("");
	const [isOpenModal, setIsOpenModal] = useState(false);
	const router = useRouter();
	useEffect(() => {
		const fetchUser = async () => {
			const response = await fetch("/api/user");
			const data = await response.json();
			setUser(data);
		};

		fetchUser();
	}, []);

	const form = useForm<VehicleFormData>({
		resolver: zodResolver(vehicleSchema),
		defaultValues: {
			make: "",
			model: "",
			year: new Date().getFullYear(),
			fuelType: "DIESEL" as FuelType,
		},
	});

	const years = Array.from({ length: new Date().getFullYear() - 2018 }, (_, i) => new Date().getFullYear() - i);

	const { addVehicle: addVehicleToStore } = useStore();

	async function onSubmit(data: VehicleFormData) {
		try {
			const newVehicle = await addVehicle(data);
			console.log("New Vehicle:", newVehicle);
			addVehicleToStore(newVehicle);
			console.log(JSON.stringify(newVehicle, null, 2));
			router.push("/dashboard");

			toast.success("Veículo adicionado com sucesso!");
			form.reset();
			setIsOpenModal(false);
		} catch (error) {
			toast.error("Erro ao adicionar veículo");
			console.error("Erro ao adicionar veículo:", error instanceof Error ? error.message : "Erro desconhecido");
		}
	}

	return (
		<Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
			<DialogTrigger asChild>
				<Button variant="outline" className="gap-2">
					<PlusIcon className="size-8" />
					<Car className="size-8" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg mx-auto bg-amber-300">
				<DialogHeader>
					<DialogTitle>{}</DialogTitle>
					<DialogDescription>{}</DialogDescription>
				</DialogHeader>
				<Card className="w-full">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">Adicionar Veículo</CardTitle>
						<CardDescription>Preencha os dados do seu veículo</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<FormField
									control={form.control}
									name="make"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Marca</FormLabel>
											<FormControl>
												<Select
													onValueChange={(value) => {
														field.onChange(value);
														setSelectedMake(value);
													}}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione a marca" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{vehicleMakes.map((make) => (
															<SelectItem key={make.make} value={make.make}>
																{make.make}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="model"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Modelo</FormLabel>
											<FormControl>
												{/* <Input placeholder="Ex: Corolla" {...field} />
												 */}
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione o modelo" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{vehicleMakes
															.find((make) => make.make === selectedMake)
															?.models.map((model) => (
																<SelectItem key={model} value={model}>
																	{model}
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="year"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ano</FormLabel>
											<FormControl>
												<RadioGroup
													onValueChange={(value) => {
														field.onChange(Number(value));
													}}
													className="flex flex-wrap justify-center gap-2"
													defaultValue={new Date().getFullYear().toString()}
													value={field.value.toString()}
												>
													{years.map((year) => (
														<FormItem
															className="flex flex-col justify-center items-center p-2 rounded-md border-2 border-gray-200 hover:bg-gray-100 cursor-pointer size-14"
															key={year}
														>
															<FormControl>
																<RadioGroupItem value={year.toString()} />
															</FormControl>
															<FormLabel className="font-normal">{year}</FormLabel>
														</FormItem>
													))}
												</RadioGroup>
											</FormControl>
											<FormDescription>
												Ano entre {new Date().getFullYear() - 7} e {new Date().getFullYear()}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fuelType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Combustível</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o combustível" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="GASOLINE">Gasolina</SelectItem>
													<SelectItem value="ELECTRIC">Elétrico</SelectItem>
													<SelectItem value="HYBRID">Híbrido</SelectItem>
													<SelectItem value="DIESEL">Diesel</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting ? "Adicionando..." : "Adicionar Veículo"}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</DialogContent>
		</Dialog>
	);
}
