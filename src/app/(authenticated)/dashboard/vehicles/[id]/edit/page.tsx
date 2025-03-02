"use client";

import { getVehicleById, updateVehicle } from "@/actions/vehicle-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { vehicleMakes } from "@/constant/vehicle-data";
import { cn } from "@/lib/utils";
import { vehicleSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { FuelType, VehicleOwnership } from "@prisma/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof vehicleSchema>;

export default function EditVehiclePage() {
	const router = useRouter();
	const params = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedMake, setSelectedMake] = useState<string>("");
	const [availableModels, setAvailableModels] = useState<string[]>([]);

	const form = useForm<FormData>({
		resolver: zodResolver(vehicleSchema),
		defaultValues: {
			make: "",
			model: "",
			year: new Date().getFullYear(),
			fuelType: FuelType.GASOLINE,
			isDefault: false,
			ownership: VehicleOwnership.OWNED,
			weeklyRent: undefined,
			commissionRate: undefined,
			licensePlate: "",
		},
	});

	const ownershipType = form.watch("ownership");

	// Atualizar os modelos disponíveis quando a marca for alterada
	useEffect(() => {
		if (selectedMake) {
			const makeData = vehicleMakes.find((item) => item.make === selectedMake);
			if (makeData) {
				setAvailableModels(makeData.models);
				// Não limpar o modelo aqui, pois pode estar carregando dados existentes
			}
		} else {
			setAvailableModels([]);
		}
	}, [selectedMake]);

	// Carregar dados do veículo
	useEffect(() => {
		async function loadVehicle() {
			try {
				setIsLoading(true);
				const result = await getVehicleById(params.id as string);

				if (result && !("error" in result)) {
					// Preencher o formulário com os dados do veículo
					form.reset({
						make: result.make,
						model: result.model,
						year: result.year,
						fuelType: result.fuelType,
						isDefault: result.isDefault,
						ownership: result.ownership,
						weeklyRent: result.weeklyRent || undefined,
						commissionRate: result.commissionRate || undefined,
						licensePlate: result.licensePlate || "",
					});

					// Atualizar a marca selecionada para carregar os modelos disponíveis
					setSelectedMake(result.make);
				} else {
					toast.error(result?.error || "Erro ao carregar veículo");
					router.push("/dashboard/vehicles");
				}
			} catch (error) {
				console.error("Erro ao carregar veículo:", error);
				toast.error("Erro ao carregar veículo");
				router.push("/dashboard/vehicles");
			} finally {
				setIsLoading(false);
			}
		}

		loadVehicle();
	}, [params.id, router, form]);

	async function onSubmit(data: FormData) {
		try {
			setIsSubmitting(true);
			const result = await updateVehicle(params.id as string, data);

			if (result && "success" in result) {
				toast.success("Veículo atualizado com sucesso");
				router.push(`/dashboard/vehicles/${params.id}`);
			} else {
				toast.error(result?.error || "Erro ao atualizar veículo");
			}
		} catch (error) {
			console.error("Erro ao atualizar veículo:", error);
			toast.error("Erro ao atualizar veículo");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return (
			<div className="container py-10">
				<div className="flex items-center gap-4 mb-6">
					<Button variant="outline" size="icon" asChild>
						<Link href={`/dashboard/vehicles/${params.id}`}>
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
				</div>
				<div className="h-64 bg-muted animate-pulse rounded" />
			</div>
		);
	}

	return (
		<div className="container py-20 md:py-0">
			<div className="flex items-center gap-4 mb-6">
				<Button variant="outline" size="icon" asChild>
					<Link href={`/dashboard/vehicles/${params.id}`}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">Editar Veículo</h1>
			</div>

			<Card className="w-full mx-auto">
				<CardHeader>
					<CardTitle>Informações do Veículo</CardTitle>
					<CardDescription>Atualize os dados do veículo.</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="make"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Marca</FormLabel>
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
											<FormDescription>Selecione a marca do veículo.</FormDescription>
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
											<Select
												onValueChange={field.onChange}
												value={field.value}
												disabled={availableModels.length === 0}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={
																availableModels.length === 0 ? "Selecione uma marca primeiro" : "Selecione o modelo"
															}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{availableModels.map((model) => (
														<SelectItem key={model} value={model}>
															{model}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>Selecione o modelo do veículo.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="year"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ano</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min={new Date().getFullYear() - 20}
													max={new Date().getFullYear() + 1}
													onChange={(e) => field.onChange(Number(e.target.value))}
												/>
											</FormControl>
											<FormDescription>Informe o ano de fabricação do veículo.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="licensePlate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Placa do Veículo</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Ex: AB-123-CD" />
											</FormControl>
											<FormDescription>Informe a placa do veículo (opcional).</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="fuelType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de Combustível</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o tipo de combustível" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={FuelType.GASOLINE}>Gasolina</SelectItem>
													<SelectItem value={FuelType.DIESEL}>Diesel</SelectItem>
													<SelectItem value={FuelType.ELECTRIC}>Elétrico</SelectItem>
													<SelectItem value={FuelType.HYBRID}>Híbrido</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>Selecione o tipo de combustível do veículo.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="ownership"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de Propriedade</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o tipo de propriedade" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={VehicleOwnership.OWNED}>Próprio</SelectItem>
													<SelectItem value={VehicleOwnership.RENTED}>Alugado</SelectItem>
													<SelectItem value={VehicleOwnership.COMMISSION}>Comissão</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>Selecione o tipo de propriedade do veículo.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							{ownershipType === VehicleOwnership.RENTED && (
								<FormField
									control={form.control}
									name="weeklyRent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Valor do Aluguel Semanal (€)</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min={0}
													step={0.01}
													onChange={(e) => field.onChange(Number(e.target.value))}
													value={field.value === undefined ? "" : field.value}
												/>
											</FormControl>
											<FormDescription>
												Este valor será adicionado automaticamente como despesa ao criar um período semanal com este
												veículo.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{ownershipType === VehicleOwnership.COMMISSION && (
								<FormField
									control={form.control}
									name="commissionRate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Porcentagem de Comissão (%)</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min={0}
													max={100}
													step={0.1}
													onChange={(e) => field.onChange(Number(e.target.value))}
													value={field.value === undefined ? "" : field.value}
												/>
											</FormControl>
											<FormDescription>
												Esta porcentagem será usada para calcular a comissão sobre os ganhos.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="isDefault"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Veículo Padrão</FormLabel>
											<FormDescription>Definir este veículo como padrão para novos turnos</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Atualizando...
									</>
								) : (
									"Atualizar Veículo"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
