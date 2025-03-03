"use client";

import { createFuelRecord } from "@/actions/fuel-actions";
import { getVehicles } from "@/actions/vehicle-actions";
import { getWeeklyPeriods } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fuelRecordSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof fuelRecordSchema>;

export default function NewFuelRecordPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [vehicles, setVehicles] = useState<any[]>([]);
	const [weeklyPeriods, setWeeklyPeriods] = useState<any[]>([]);

	const form = useForm<FormData>({
		resolver: zodResolver(fuelRecordSchema),
		defaultValues: {
			date: new Date(),
			amount: undefined,
			price: undefined,
			totalCost: undefined,
			odometer: undefined,
			fullTank: false,
			location: "",
			notes: "",
			vehicleId: "",
			weeklyPeriodId: "none",
		},
	});

	useEffect(() => {
		async function loadData() {
			try {
				setIsLoading(true);

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
			} catch (error) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados necessários");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, []);

	// Atualizar o custo total quando quantidade ou preço mudar
	useEffect(() => {
		const subscription = form.watch((value, { name }) => {
			if (name === "amount" || name === "price") {
				const amount = value.amount as number;
				const price = value.price as number;

				if (amount && price) {
					form.setValue("totalCost", amount * price);
				}
			}
		});

		return () => subscription.unsubscribe();
	}, [form]);

	async function onSubmit(data: FormData) {
		try {
			setIsSubmitting(true);

			// Calcular o custo total se não estiver definido
			if (!data.totalCost) {
				data.totalCost = data.amount * data.price;
			}

			// Tratar o valor "none" como undefined para weeklyPeriodId
			if (data.weeklyPeriodId === "none") {
				data.weeklyPeriodId = undefined;
			}

			const result = await createFuelRecord(data);

			if (result.success) {
				toast.success("Registro de combustível adicionado com sucesso");
				router.push("/dashboard/fuel-records");
			} else {
				toast.error(result.error || "Erro ao adicionar registro de combustível");
			}
		} catch (error) {
			console.error("Erro ao adicionar registro de combustível:", error);
			toast.error("Erro ao adicionar registro de combustível");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return (
			<div className="container py-10 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="container py-6">
			<div className="flex items-center mb-6">
				<Button variant="ghost" size="sm" className="mr-2" asChild>
					<Link href="/dashboard/fuel-records">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">Novo Registro de Combustível</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Adicionar Registro</CardTitle>
					<CardDescription>Registre um novo abastecimento de combustível</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Data</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={"outline"}
														className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
													disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
													initialFocus
													locale={ptBR}
												/>
											</PopoverContent>
										</Popover>
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
												{vehicles.map((vehicle) => (
													<SelectItem key={vehicle.id} value={vehicle.id}>
														{vehicle.make} {vehicle.model} ({vehicle.year})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<FormField
									control={form.control}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Quantidade</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="Ex: 40.5"
													{...field}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || undefined)}
												/>
											</FormControl>
											<FormDescription>Litros ou kWh</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="price"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Preço por unidade</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.001"
													placeholder="Ex: 1.899"
													{...field}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || undefined)}
												/>
											</FormControl>
											<FormDescription>€ por litro ou kWh</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<FormField
									control={form.control}
									name="totalCost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Custo Total</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="Calculado automaticamente"
													{...field}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || undefined)}
												/>
											</FormControl>
											<FormDescription>Calculado automaticamente (pode ser ajustado)</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="odometer"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Quilometragem</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													placeholder="Ex: 12345.6"
													{...field}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || undefined)}
												/>
											</FormControl>
											<FormDescription>Odômetro no momento do abastecimento</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="weeklyPeriodId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Período Semanal (opcional)</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione um período (opcional)" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">Nenhum</SelectItem>
												{weeklyPeriods.map((period) => (
													<SelectItem key={period.id} value={period.id}>
														{period.name || format(new Date(period.startDate), "dd/MM/yyyy")} -{" "}
														{format(new Date(period.endDate), "dd/MM/yyyy")}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											Associar a um período semanal. Uma despesa de combustível será criada automaticamente.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="fullTank"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
										<FormControl>
											<Checkbox checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>Tanque Cheio</FormLabel>
											<FormDescription>Marque esta opção se o tanque foi completamente abastecido</FormDescription>
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="location"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Local</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Ex: Posto XYZ" />
										</FormControl>
										<FormDescription>Onde foi realizado o abastecimento (opcional)</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Observações</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="Detalhes adicionais sobre o abastecimento"
												className="resize-none"
											/>
										</FormControl>
										<FormDescription>Opcional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Adicionando...
									</>
								) : (
									"Adicionar Registro"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
