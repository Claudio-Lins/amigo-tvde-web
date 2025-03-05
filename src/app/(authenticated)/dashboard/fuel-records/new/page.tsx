"use client";

import { createFuelRecord } from "@/actions/fuel-actions";
import { getUserShifts } from "@/actions/shift-actions";
import { getVehicles } from "@/actions/vehicle-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fuelRecordSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { FuelType, Shift, Vehicle } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface ShiftWithVehicle extends Shift {
	vehicle?: Vehicle;
}

export default function NewFuelRecordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const vehicleId = searchParams.get("vehicleId");
	const shiftId = searchParams.get("shiftId");
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [shifts, setShifts] = useState<ShiftWithVehicle[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
	const [chargingMethod, setChargingMethod] = useState<"volume" | "time">("volume");

	// Carregar veículos e turnos
	useEffect(() => {
		async function loadData() {
			try {
				setIsLoading(true);
				const [vehiclesResult, shiftsResult] = await Promise.all([getVehicles(), getUserShifts()]);

				if (vehiclesResult && !("error" in vehiclesResult)) {
					setVehicles(vehiclesResult);

					// Se tiver um vehicleId no URL, selecionar esse veículo
					if (vehicleId) {
						const vehicle = vehiclesResult.find((v: Vehicle) => v.id === vehicleId);
						if (vehicle) {
							setSelectedVehicle(vehicle);
							// Se for elétrico, definir método de carregamento como tempo
							if (vehicle.fuelType === "ELECTRIC") {
								setChargingMethod("time");
							}
						}
					}
				}

				if (shiftsResult && !("error" in shiftsResult)) {
					// Ordenar turnos por data (mais recentes primeiro)
					const sortedShifts = shiftsResult.sort(
						(a: ShiftWithVehicle, b: ShiftWithVehicle) => new Date(b.date).getTime() - new Date(a.date).getTime(),
					);
					setShifts(sortedShifts);
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados necessários");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, [vehicleId]);

	const form = useForm<z.infer<typeof fuelRecordSchema>>({
		resolver: zodResolver(fuelRecordSchema),
		defaultValues: {
			date: new Date(),
			odometer: 0,
			amount: 0,
			price: 0,
			totalCost: 0,
			fullTank: true,
			notes: "",
			vehicleId: vehicleId || "",
			shiftId: shiftId || "",
		},
	});

	// Atualizar o formulário quando o veículo for selecionado
	useEffect(() => {
		if (selectedVehicle) {
			form.setValue("vehicleId", selectedVehicle.id);

			// Se for elétrico, definir método de carregamento como tempo
			if (selectedVehicle.fuelType === "ELECTRIC") {
				setChargingMethod("time");
			} else {
				setChargingMethod("volume");
			}
		}
	}, [selectedVehicle, form]);

	// Função para calcular o preço total
	function calculateTotalPrice() {
		const fuelAmount = form.getValues("amount");
		const pricePerUnit = form.getValues("price");

		if (fuelAmount && pricePerUnit) {
			const totalPrice = fuelAmount * pricePerUnit;
			form.setValue("totalCost", Number(totalPrice.toFixed(2)));
		}
	}

	// Função para calcular a quantidade de combustível a partir do preço total
	function calculateFuelAmount() {
		const totalPrice = form.getValues("totalCost");
		const pricePerUnit = form.getValues("price");

		if (totalPrice && pricePerUnit && pricePerUnit > 0) {
			const fuelAmount = totalPrice / pricePerUnit;
			form.setValue("amount", Number(fuelAmount.toFixed(2)));
		}
	}

	async function onSubmit(data: z.infer<typeof fuelRecordSchema>) {
		setIsSubmitting(true);
		console.log(data);
		try {
			// Se for método de tempo para veículo elétrico, converter minutos para kWh estimado
			if (chargingMethod === "time" && selectedVehicle?.fuelType === "ELECTRIC") {
				// Aqui estamos mantendo o valor original, mas podemos adicionar uma conversão se necessário
				// Por exemplo, estimar kWh com base no tempo e potência do carregador
				// data.fuelAmount = estimateKwhFromMinutes(data.fuelAmount);
			}

			const result = await createFuelRecord(data);

			if (result && "success" in result) {
				toast.success("Registro de combustível adicionado com sucesso");
				router.push("/dashboard/fuel-records");
			} else {
				toast.error(result?.error || "Erro ao adicionar registro de combustível");
			}
		} catch (error) {
			console.error("Erro ao adicionar registro:", error);
			toast.error("Erro ao adicionar registro de combustível");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="container py-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Novo Registro de Combustível</CardTitle>
					<CardDescription>
						Registre um abastecimento ou carregamento para acompanhar o consumo do seu veículo.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Veículo */}
								<FormField
									control={form.control}
									name="vehicleId"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Veículo</FormLabel>
											<Select
												disabled={isLoading}
												onValueChange={(value) => {
													field.onChange(value);
													const vehicle = vehicles.find((v) => v.id === value);
													if (vehicle) {
														setSelectedVehicle(vehicle);
													}
												}}
												value={field.value as string}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione um veículo" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{vehicles.map((vehicle) => (
														<SelectItem key={vehicle.id} value={vehicle.id}>
															{vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Turno */}
								<FormField
									control={form.control}
									name="shiftId"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Turno</FormLabel>
											<Select disabled={isLoading} onValueChange={field.onChange} value={field.value as string}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione um turno" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{shifts.map((shift) => (
														<SelectItem key={shift.id} value={shift.id}>
															{format(new Date(shift.date), "dd/MM/yyyy", { locale: ptBR })} -
															{shift.vehicle ? ` ${shift.vehicle.brand} ${shift.vehicle.model}` : ""} -
															{shift.odometer ? ` ${shift.odometer.toFixed(0)} km` : ""}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>Selecione o turno ao qual este abastecimento está associado</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Data */}
								<FormField
									control={form.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Data</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={"outline"}
															className={cn(
																"w-full pl-3 text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value ? (
																format(field.value, "PPP", { locale: ptBR })
															) : (
																<span>Selecione uma data</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value}
														onSelect={field.onChange}
														disabled={(date) => date > new Date()}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Odômetro */}
								<FormField
									control={form.control}
									name="odometer"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Odômetro (km)</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min={0}
													step={0.1}
													onChange={(e) => field.onChange(Number(e.target.value))}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Método de Carregamento (apenas para veículos elétricos) */}
								{selectedVehicle?.fuelType === "ELECTRIC" && (
									<div className="md:col-span-2">
										<FormLabel>Método de Carregamento</FormLabel>
										<RadioGroup
											value={chargingMethod}
											onValueChange={(value) => setChargingMethod(value as "volume" | "time")}
											className="flex space-x-4 mt-2"
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="volume" id="volume" />
												<label htmlFor="volume">kWh (energia)</label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="time" id="time" />
												<label htmlFor="time">Minutos (tempo)</label>
											</div>
										</RadioGroup>
									</div>
								)}

								{/* Quantidade de Combustível */}
								<FormField
									control={form.control}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{selectedVehicle?.fuelType === "ELECTRIC"
													? chargingMethod === "time"
														? "Tempo de Carregamento (min)"
														: "Energia (kWh)"
													: "Quantidade (litros)"}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min={0}
													step={0.01}
													onChange={(e) => {
														field.onChange(Number(e.target.value));
														calculateTotalPrice();
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Preço por Unidade */}
								<FormField
									control={form.control}
									name="price"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{selectedVehicle?.fuelType === "ELECTRIC"
													? chargingMethod === "time"
														? "Preço por Minuto (€)"
														: "Preço por kWh (€)"
													: "Preço por Litro (€)"}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min={0}
													step={0.001}
													onChange={(e) => {
														field.onChange(Number(e.target.value));
														calculateTotalPrice();
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Preço Total */}
								<FormField
									control={form.control}
									name="totalCost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Preço Total (€)</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min={0}
													step={0.01}
													onChange={(e) => {
														field.onChange(Number(e.target.value));
														calculateFuelAmount();
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Tanque Cheio */}
								<FormField
									control={form.control}
									name="fullTank"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 md:col-span-2">
											<FormControl>
												<Checkbox checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>
													{selectedVehicle?.fuelType === "ELECTRIC" ? "Carregamento completo" : "Tanque cheio"}
												</FormLabel>
												<FormDescription>
													{selectedVehicle?.fuelType === "ELECTRIC"
														? "Marque se o veículo foi carregado até 100%"
														: "Marque se o tanque foi completamente abastecido"}
												</FormDescription>
											</div>
										</FormItem>
									)}
								/>

								{/* Observações */}
								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Observações</FormLabel>
											<FormControl>
												<Textarea {...field} placeholder="Observações sobre o abastecimento (opcional)" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Registrando...
									</>
								) : (
									"Registrar Abastecimento"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
