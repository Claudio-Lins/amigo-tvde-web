"use client";

import { createShift } from "@/actions/shift-actions";
import { getVehicles } from "@/actions/vehicle-actions";
import { getWeeklyPeriods } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { shiftSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, ClockIcon, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function NewShiftPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const weeklyPeriodId = searchParams.get("weeklyPeriodId");
	const [vehicles, setVehicles] = useState<any[]>([]);
	const [weeklyPeriods, setWeeklyPeriods] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<z.infer<typeof shiftSchema>>({
		resolver: zodResolver(shiftSchema),
		defaultValues: {
			date: new Date(),
			uberEarnings: 0,
			boltEarnings: 0,
			odometer: 0,
			vehicleId: "",
			notes: "",
			weeklyPeriodId: weeklyPeriodId || "",
		},
	});

	useEffect(() => {
		async function loadData() {
			try {
				// Carregar veículos
				const vehiclesResult = await getVehicles();
				if (vehiclesResult && !("error" in vehiclesResult)) {
					setVehicles(vehiclesResult);

					// Se houver apenas um veículo, selecioná-lo automaticamente
					if (vehiclesResult.length === 1) {
						form.setValue("vehicleId", vehiclesResult[0].id);
					}
				}

				// Carregar períodos semanais
				const periodsResult = await getWeeklyPeriods();
				if (periodsResult && !("error" in periodsResult)) {
					// Filtrar apenas períodos ativos
					const activePeriods = periodsResult.filter((period) => period.isActive);
					setWeeklyPeriods(activePeriods);

					// Se não houver weeklyPeriodId no URL e houver apenas um período ativo, selecioná-lo
					if (!weeklyPeriodId && activePeriods.length === 1) {
						form.setValue("weeklyPeriodId", activePeriods[0].id);
					}

					// Se houver weeklyPeriodId no URL, verificar se é válido
					if (weeklyPeriodId) {
						const periodExists = activePeriods.some((period) => period.id === weeklyPeriodId);
						if (periodExists) {
							form.setValue("weeklyPeriodId", weeklyPeriodId);
						} else {
							// Se o período não existir ou não estiver ativo, selecionar o primeiro ativo
							if (activePeriods.length > 0) {
								form.setValue("weeklyPeriodId", activePeriods[0].id);
								toast.warning("O período semanal selecionado não está disponível. Selecionamos outro período ativo.");
							}
						}
					}
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados necessários");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, [form, weeklyPeriodId]);

	async function onSubmit(data: z.infer<typeof shiftSchema>) {
		// Verificar se weeklyPeriodId está vazio
		if (!data.weeklyPeriodId) {
			toast.error("É necessário selecionar um período semanal");
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await createShift(data);

			if (result && "success" in result) {
				toast.success("Turno registrado com sucesso!");
				router.push(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
			} else {
				toast.error(result?.error || "Erro ao registrar turno");
			}
		} catch (error) {
			console.error("Erro ao registrar turno:", error);
			toast.error("Erro ao registrar turno");
		} finally {
			setIsSubmitting(false);
		}
	}

	// Verificar se a data está dentro do período semanal
	function isDateWithinPeriod(date: Date) {
		if (!weeklyPeriods.length) return true;

		return isWithinInterval(date, {
			start: new Date(weeklyPeriods[0].startDate),
			end: new Date(weeklyPeriods[0].endDate),
		});
	}

	function calculateOdometer() {
		const initialValue = form.getValues("initialOdometer");
		const finalValue = form.getValues("finalOdometer");

		if (initialValue !== undefined && finalValue !== undefined && finalValue !== null) {
			const total = finalValue - initialValue;
			if (total >= 0) {
				form.setValue("odometer", total);
			} else {
				toast.error("A quilometragem final deve ser maior que a inicial");
			}
		} else {
			toast.error("Preencha as quilometragens inicial e final");
		}
	}

	if (isLoading) {
		return (
			<div className="container py-10">
				<div className="flex flex-col space-y-4 max-w-md mx-auto">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="h-64 bg-muted animate-pulse rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="container py-10 md:py-0">
			{/* <div className="max-w-md mx-auto "> */}
			<div className="flex items-center gap-4 mb-6">
				<Button variant="outline" size="icon" asChild>
					<Link href={weeklyPeriodId ? `/dashboard/weekly-periods/${weeklyPeriodId}` : "/dashboard/weekly-periods"}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">Registrar Novo Turno</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Detalhes do Turno</CardTitle>
					<CardDescription>
						Registre os detalhes do seu turno para o período{" "}
						{weeklyPeriods.length > 0 ? weeklyPeriods[0].name : "selecionado"}.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<div className="space-y-6">
								{/* Data e Veículo */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="date"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>Data do Turno</FormLabel>
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
															disabled={(date) => !isDateWithinPeriod(date)}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormDescription>
													Selecione a data do turno. Deve estar dentro do período semanal.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="vehicleId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Veículo</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione um veículo" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{vehicles.length > 0 ? (
															vehicles.map((vehicle) => (
																<SelectItem key={vehicle.id} value={vehicle.id}>
																	{vehicle.brand} {vehicle.model} ({vehicle.year})
																</SelectItem>
															))
														) : (
															<SelectItem value="none" disabled>
																Nenhum veículo cadastrado
															</SelectItem>
														)}
													</SelectContent>
												</Select>
												<FormDescription>
													Selecione o veículo utilizado neste turno.
													{vehicles.length === 0 && (
														<Link href="/dashboard/vehicles/new" className="text-primary ml-1">
															Cadastrar veículo
														</Link>
													)}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="startTime"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Hora Inicial</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"w-full pl-3 text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																{field.value ? format(field.value, "HH:mm") : <span>Selecione a hora</span>}
																<ClockIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<TimePicker date={field.value || new Date()} setDate={(date) => field.onChange(date)} />
													</PopoverContent>
												</Popover>
												<FormDescription>Hora de início do turno</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="endTime"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Hora Final</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"w-full pl-3 text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																{field.value ? format(field.value, "HH:mm") : <span>Selecione a hora</span>}
																<ClockIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<TimePicker date={field.value || new Date()} setDate={(date) => field.onChange(date)} />
													</PopoverContent>
												</Popover>
												<FormDescription>Hora de término do turno</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="breakMinutes"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Tempo de Pausa (minutos)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="5"
														{...field}
														onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
													/>
												</FormControl>
												<FormDescription>Tempo total de pausas durante o turno</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Quilometragem */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
									<FormField
										control={form.control}
										name="initialOdometer"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Quilometragem Inicial (km)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														// min={0}
														step={0.1}
														onChange={(e) => {
															const value = Number.parseFloat(e.target.value) || 0;
															field.onChange(value);

															// Atualizar o odometer se finalOdometer estiver preenchido
															const finalValue = form.getValues("finalOdometer");
															if (finalValue !== undefined && finalValue !== null) {
																form.setValue("odometer", finalValue - value);
															}
														}}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="finalOdometer"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Quilometragem Final (km) (opcional)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														// min={0}
														step={0.1}
														value={field.value === null ? "" : field.value}
														onChange={(e) => {
															const value = e.target.value === "" ? null : Number.parseFloat(e.target.value);
															field.onChange(value);

															// Atualizar o odometer se ambos os valores estiverem preenchidos
															if (value !== null) {
																const initialValue = form.getValues("initialOdometer");
																form.setValue("odometer", value - initialValue);
															}
														}}
													/>
												</FormControl>
												<FormDescription className="text-xs">
													Deixe em branco para preencher posteriormente
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="odometer"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Quilometragem Total (km)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														// min={0}
														step={0.1}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Ganhos */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="uberEarnings"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Ganhos Uber (€)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														// min={0}
														step={0.01}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="boltEarnings"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Ganhos Bolt (€)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														// min={0}
														step={0.01}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || null)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="otherEarnings"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Outros Ganhos (€)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														// min={0}
														step={0.01}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || null)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Observações */}
								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Observações</FormLabel>
											<FormControl>
												<Textarea {...field} placeholder="Observações sobre o turno (opcional)" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* <div className="flex items-center gap-2 mt-2">
								<Button type="button" variant="outline" size="sm" onClick={calculateOdometer}>
									Calcular Quilometragem Total
								</Button>
							</div> */}

							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Registrando...
									</>
								) : (
									"Registrar Turno"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
			{/* </div> */}
		</div>
	);
}
