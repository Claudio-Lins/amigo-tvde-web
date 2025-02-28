"use client";

import { addVehicle } from "@/actions/vehicle-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleMakes } from "@/constant/vehicle-data";
import { VehicleFormData, vehicleSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { FuelType } from "@prisma/client";
import { Car } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function OnboardingPage() {
	const [selectedMake, setSelectedMake] = useState<string>("");
	const router = useRouter();

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

	// async function onSubmit(data: VehicleFormData) {
	// 	try {
	// 		const result = await addVehicle(data);

	// 		if (result.error) {
	// 			toast.error(result.error);
	// 		} else if (result.success) {
	// 			toast.success("Veículo adicionado com sucesso!");
	// 			router.push("/dashboard"); // Redireciona para o dashboard após adicionar o veículo
	// 		}
	// 	} catch (error) {
	// 		toast.error("Erro ao adicionar veículo");
	// 		console.error("Erro ao adicionar veículo:", error instanceof Error ? error.message : "Erro desconhecido");
	// 	}
	// }

	return (
		<div className="container max-w-md py-10">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Bem-vindo ao Amigo TVDE</CardTitle>
					<CardDescription>Para começar, adicione seu primeiro veículo para registrar seus turnos.</CardDescription>
				</CardHeader>
				<CardContent>
					{/* <Form {...form}>
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
													form.setValue("model", "");
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
											<Select onValueChange={field.onChange} value={field.value} disabled={!selectedMake}>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={selectedMake ? "Selecione o modelo" : "Selecione uma marca primeiro"}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{selectedMake &&
														vehicleMakes
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
												onValueChange={(value) => field.onChange(Number(value))}
												className="flex flex-wrap gap-2"
												value={String(field.value)}
											>
												{years.map((year) => (
													<FormItem
														key={year}
														className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-muted"
													>
														<FormControl>
															<RadioGroupItem value={year.toString()} />
														</FormControl>
														<FormLabel className="font-normal cursor-pointer">{year}</FormLabel>
													</FormItem>
												))}
											</RadioGroup>
										</FormControl>
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
										<Select onValueChange={field.onChange} value={field.value || "DIESEL"}>
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
								{form.formState.isSubmitting ? "Adicionando..." : "Adicionar Veículo e Continuar"}
							</Button>
						</form>
					</Form> */}
				</CardContent>
				<CardFooter className="flex justify-center">
					<div className="flex items-center text-sm text-muted-foreground">
						<Car className="mr-2 h-4 w-4" />
						<span>Você poderá adicionar mais veículos depois</span>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
