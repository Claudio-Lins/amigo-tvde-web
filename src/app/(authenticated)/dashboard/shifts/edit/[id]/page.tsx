"use client";

import { getShiftById, updateShift } from "@/actions/shift-actions";
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
import { format, set } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, ClockIcon, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof shiftSchema>;

export default function EditShiftPage() {
	const router = useRouter();
	const params = useParams();
	const shiftId = params.id as string;

	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [vehicles, setVehicles] = useState<any[]>([]);
	const [weeklyPeriods, setWeeklyPeriods] = useState<any[]>([]);
	const [shift, setShift] = useState<any>(null);

	const form = useForm<FormData>({
		resolver: zodResolver(shiftSchema),
		defaultValues: {
			date: new Date(),
			startTime: undefined,
			endTime: undefined,
			breakMinutes: 0,
			uberEarnings: 0,
			boltEarnings: 0,
			otherEarnings: 0,
			initialOdometer: 0,
			finalOdometer: undefined,
			odometer: 0,
			vehicleId: "",
			notes: "",
			weeklyPeriodId: "",
		},
	});

	useEffect(() => {
		async function loadData() {
			try {
				setIsLoading(true);

				// Carregar dados do turno
				const shiftResult = await getShiftById(shiftId);

				console.log("Dados do turno carregados:", shiftResult);

				if (shiftResult && !("error" in shiftResult)) {
					setShift(shiftResult.shift);

					// Carregar veículos
					const vehiclesResult = await getVehicles();
					if (vehiclesResult && !("error" in vehiclesResult)) {
						setVehicles(vehiclesResult);
					}

					// Carregar períodos semanais
					const periodsResult = await getWeeklyPeriods();
					if (periodsResult && !("error" in periodsResult)) {
						setWeeklyPeriods(periodsResult);
					}

					// Preencher o formulário com os dados do turno
					const { shift } = shiftResult;

					// Converter datas para objetos Date
					const shiftDate = new Date(shift.date);

					// Processar startTime e endTime
					const startTime = shift.startTime ? new Date(shift.startTime) : undefined;
					const endTime = shift.endTime ? new Date(shift.endTime) : undefined;

					form.reset({
						date: shiftDate,
						startTime,
						endTime,
						breakMinutes: shift.breakMinutes || 0,
						uberEarnings: shift.uberEarnings,
						boltEarnings: shift.boltEarnings,
						otherEarnings: shift.otherEarnings || 0,
						initialOdometer: shift.initialOdometer || 0,
						finalOdometer: shift.finalOdometer || undefined,
						odometer: shift.odometer,
						vehicleId: shift.vehicleId,
						notes: shift.notes || "",
						weeklyPeriodId: shift.weeklyPeriodId || "",
					});
				} else {
					toast.error(shiftResult?.error || "Erro ao carregar dados do turno");
					router.push("/dashboard/shifts");
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados necessários");
				router.push("/dashboard/shifts");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, [form, shiftId, router]);

	async function onSubmit(data: FormData) {
		try {
			setIsSubmitting(true);

			// Log dos dados antes de enviar
			console.log("Enviando dados de atualização:", data);

			// Usar a server action para atualizar o turno
			const result = await updateShift(shiftId, data);

			if (result && "success" in result) {
				toast.success("Turno atualizado com sucesso!");
				router.push(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
			} else {
				toast.error(result?.error || "Erro ao atualizar turno");
			}
		} catch (error) {
			console.error("Erro ao atualizar turno:", error);
			toast.error("Erro ao atualizar turno");
		} finally {
			setIsSubmitting(false);
		}
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

	function calculateShiftDuration(startTime: Date | null, endTime: Date | null, breakMinutes: number) {
		if (!startTime || !endTime) return "0h 0m";

		// Calcular a diferença em minutos
		let diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

		// Subtrair o tempo de pausa
		diffMinutes -= breakMinutes;

		// Converter para horas e minutos
		const hours = Math.floor(diffMinutes / 60);
		const minutes = Math.floor(diffMinutes % 60);

		return `${hours}h ${minutes}m`;
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
			<div className="flex items-center gap-4 mb-6">
				<Button variant="outline" size="icon" asChild>
					<Link
						href={
							shift?.weeklyPeriodId ? `/dashboard/weekly-periods/${shift.weeklyPeriodId}` : "/dashboard/weekly-periods"
						}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">Editar Turno</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Detalhes do Turno</CardTitle>
					<CardDescription>Edite os detalhes do seu turno, incluindo horários e quilometragem.</CardDescription>
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
														<Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
													</PopoverContent>
												</Popover>
												<FormDescription>Selecione a data do turno.</FormDescription>
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
																	{vehicle.make} {vehicle.model} ({vehicle.year})
																</SelectItem>
															))
														) : (
															<SelectItem value="none" disabled>
																Nenhum veículo cadastrado
															</SelectItem>
														)}
													</SelectContent>
												</Select>
												<FormDescription>Selecione o veículo utilizado neste turno.</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Período Semanal */}
								<FormField
									control={form.control}
									name="weeklyPeriodId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Período Semanal</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione um período semanal" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{weeklyPeriods.length > 0 ? (
														weeklyPeriods.map((period) => (
															<SelectItem key={period.id} value={period.id}>
																{period.name || format(new Date(period.startDate), "dd/MM/yyyy", { locale: ptBR })}
																{period.isActive && " (Ativo)"}
															</SelectItem>
														))
													) : (
														<SelectItem value="none" disabled>
															Nenhum período semanal cadastrado
														</SelectItem>
													)}
												</SelectContent>
											</Select>
											<FormDescription>Selecione o período semanal deste turno.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Horários */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="startTime"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Hora Inicial</FormLabel>
												<div className="flex gap-2 items-center">
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
													{field.value && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => field.onChange(null)}
															title="Limpar horário"
														>
															<X className="h-4 w-4" />
														</Button>
													)}
												</div>
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
												<div className="flex gap-2 items-center">
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
													{field.value && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => field.onChange(null)}
															title="Limpar horário"
														>
															<X className="h-4 w-4" />
														</Button>
													)}
												</div>
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
										name="otherEarnings"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Outros Ganhos (€)</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="number"
														step={0.01}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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

								{form.watch("startTime") && form.watch("endTime") && (
									<div className="col-span-3 mt-2">
										<p className="text-sm text-muted-foreground">
											Duração do turno:{" "}
											{calculateShiftDuration(
												form.watch("startTime") || null,
												form.watch("endTime") || null,
												form.watch("breakMinutes") || 0,
											)}
										</p>
									</div>
								)}
							</div>

							<div className="flex items-center gap-2 mt-2">
								<Button type="button" variant="outline" size="sm" onClick={calculateOdometer}>
									Calcular Quilometragem Total
								</Button>
							</div>

							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Atualizando...
									</>
								) : (
									"Atualizar Turno"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
