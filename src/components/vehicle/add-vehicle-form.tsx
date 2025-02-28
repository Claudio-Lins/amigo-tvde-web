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
import { zodResolver } from "@hookform/resolvers/zod";
import type { FuelType } from "@prisma/client";
import { Car, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface AddVehicleFormProps {
	onSuccess?: () => void; // Callback para quando um veículo é adicionado
}
export function AddVehicleForm({ onSuccess }: AddVehicleFormProps) {
	const [selectedMake, setSelectedMake] = useState<string>("");
	const [isOpenModal, setIsOpenModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
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

	const years = Array.from({ length: new Date().getFullYear() - 2018 + 1 }, (_, i) => new Date().getFullYear() - i);

	/**
	 * Função para enviar o formulário
	 * @param data Dados do formulário validados pelo Zod
	 */
	async function onSubmit(data: VehicleFormData) {
		try {
			const result = await addVehicle(data);

			if (!result || "error" in result) {
				toast.error(typeof result?.error === "string" ? result.error : "Erro ao adicionar veículo");
				return;
			}

			toast.success("Veículo adicionado com sucesso!");
			form.reset();
			setIsOpenModal(false);
			router.refresh();
			onSuccess?.();
		} catch (error) {
			toast.error("Erro ao adicionar veículo");
			console.error("Erro ao adicionar veículo:", error);
		}
	}

	return (
		<Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
			<DialogTrigger asChild>
				<Button variant="outline" className="gap-2">
					<PlusIcon className="h-4 w-4" />
					<span>Adicionar Veículo</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Adicionar Veículo</DialogTitle>
					<DialogDescription>Preencha os dados do seu veículo para começar a registrar seus turnos.</DialogDescription>
				</DialogHeader>
				<Card className="w-full border-0 shadow-none">
					<CardContent className="p-0">
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
														// Resetando o modelo quando a marca muda
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

								<div className="flex justify-end space-x-2 pt-4">
									<Button type="button" variant="outline" onClick={() => setIsOpenModal(false)}>
										Cancelar
									</Button>
									<Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
										{isSubmitting || form.formState.isSubmitting ? "Adicionando..." : "Adicionar Veículo"}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</DialogContent>
		</Dialog>
	);
}
