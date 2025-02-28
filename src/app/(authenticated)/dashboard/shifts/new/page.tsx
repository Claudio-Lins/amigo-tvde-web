"use client";

import { startShift } from "@/actions/shift-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { shiftExpenseSchema, shiftIncomeSchema, startShiftSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseCategory, FuelType, PlatformType, ShiftType } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Car, Clock, DollarSign, Fuel, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

// Defina interfaces para os tipos locais
interface ExpenseItem {
	id: string;
	category: ExpenseCategory;
	amount: number;
	description?: string;
}

interface IncomeItem {
	id: string;
	platform: PlatformType;
	amount: number;
	tripCount?: number;
	description?: string;
	isExtendedHour?: boolean;
}

// Componente para adicionar despesas
function ExpenseForm({ onAdd, onCancel }: { onAdd: (data: any) => void; onCancel: () => void }) {
	const form = useForm({
		resolver: zodResolver(shiftExpenseSchema),
		defaultValues: {
			category: undefined,
			amount: 0,
			description: "",
		},
	});

	function onSubmit(data: any) {
		onAdd(data);
		form.reset();
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Categoria</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione a categoria" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={ExpenseCategory.FUEL}>Combustível</SelectItem>
									<SelectItem value={ExpenseCategory.FOOD}>Alimentação</SelectItem>
									<SelectItem value={ExpenseCategory.MAINTENANCE}>Manutenção</SelectItem>
									<SelectItem value={ExpenseCategory.PARKING}>Estacionamento</SelectItem>
									<SelectItem value={ExpenseCategory.TOLL}>Pedágio</SelectItem>
									<SelectItem value={ExpenseCategory.OTHER}>Outros</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Valor (€)</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="0.01"
									{...field}
									onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descrição (opcional)</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						<X className="mr-2 h-4 w-4" />
						Cancelar
					</Button>
					<Button type="submit">
						<Plus className="mr-2 h-4 w-4" />
						Adicionar
					</Button>
				</div>
			</form>
		</Form>
	);
}

// Componente para adicionar rendimentos
function IncomeForm({ onAdd, onCancel }: { onAdd: (data: any) => void; onCancel: () => void }) {
	const form = useForm({
		resolver: zodResolver(shiftIncomeSchema),
		defaultValues: {
			platform: undefined,
			amount: 0,
			tripCount: 0,
			description: "",
			isExtendedHour: false,
		},
	});

	function onSubmit(data: any) {
		onAdd(data);
		form.reset();
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="platform"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Plataforma</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione a plataforma" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={PlatformType.UBER}>Uber</SelectItem>
									<SelectItem value={PlatformType.BOLT}>Bolt</SelectItem>
									<SelectItem value={PlatformType.TIPS}>Gorjetas</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Valor (€)</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="0.01"
									{...field}
									onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="tripCount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Número de viagens</FormLabel>
							<FormControl>
								<Input type="number" {...field} onChange={(e) => field.onChange(Number.parseInt(e.target.value))} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descrição (opcional)</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						<X className="mr-2 h-4 w-4" />
						Cancelar
					</Button>
					<Button type="submit">
						<Plus className="mr-2 h-4 w-4" />
						Adicionar
					</Button>
				</div>
			</form>
		</Form>
	);
}

export default function NewShiftPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [vehicles, setVehicles] = useState([
		{ id: "1", make: "Tesla", model: "Model 3", year: 2022, fuelType: FuelType.ELECTRIC },
		{ id: "2", make: "Toyota", model: "Prius", year: 2021, fuelType: FuelType.HYBRID },
	]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showExpenseForm, setShowExpenseForm] = useState(false);
	const [showIncomeForm, setShowIncomeForm] = useState(false);
	const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
	const [incomes, setIncomes] = useState<IncomeItem[]>([]);

	const form = useForm({
		resolver: zodResolver(startShiftSchema),
		defaultValues: {
			vehicleId: "",
			type: undefined,
			startTime: new Date(),
			startMileage: 0,
		},
	});

	function handleAddExpense(expense: Omit<ExpenseItem, "id">) {
		setExpenses([...expenses, { ...expense, id: `expense-${Date.now()}` }]);
		setShowExpenseForm(false);
	}

	function handleAddIncome(income: any) {
		setIncomes([...incomes, { ...income, id: `income-${Date.now()}` }]);
		setShowIncomeForm(false);
	}

	function handleRemoveExpense(id: string) {
		setExpenses(expenses.filter((expense: any) => expense.id !== id));
	}

	function handleRemoveIncome(id: string) {
		setIncomes(incomes.filter((income: any) => income.id !== id));
	}

	async function onSubmit(data: any) {
		try {
			setIsSubmitting(true);

			// Iniciar o turno
			const result = await startShift({
				...data,
				expenses: expenses.map(({ id, ...expense }: any) => expense),
				incomes: incomes.map(({ id, ...income }: any) => income),
			});

			toast({
				title: "Turno iniciado com sucesso!",
				description: `O turno foi iniciado às ${format(data.startTime, "HH:mm")} com quilometragem ${data.startMileage}km.`,
			});

			// Redirecionar para a página do turno
			router.push(`/dashboard/shifts/${result.shiftId}`);
		} catch (error) {
			console.error("Erro ao iniciar turno:", JSON.stringify(error, null, 2));
			toast({
				variant: "destructive",
				title: "Erro ao iniciar turno",
				description: (error as Error).message || "Ocorreu um erro ao iniciar o turno. Tente novamente.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Iniciar Novo Turno</h1>
					<p className="text-muted-foreground">Registre o início de um novo turno de trabalho</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>Informações Básicas</CardTitle>
							<CardDescription>Informe os dados iniciais do turno</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<FormField
								control={form.control}
								name="vehicleId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Veículo</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o veículo" />
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
										<FormDescription>Selecione o veículo que será utilizado neste turno</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Turno</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o tipo de turno" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={ShiftType.MORNING}>Manhã</SelectItem>
												<SelectItem value={ShiftType.AFTERNOON}>Tarde</SelectItem>
												<SelectItem value={ShiftType.NIGHT}>Noite</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>Indique o período do dia em que o turno será realizado</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<FormField
									control={form.control}
									name="startTime"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Data e Hora de Início</FormLabel>
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
																format(field.value, "PPP HH:mm", { locale: ptBR })
															) : (
																<span>Selecione a data e hora</span>
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
														locale={ptBR}
														initialFocus
													/>
													<div className="p-3 border-t border-border">
														<Input
															type="time"
															value={field.value ? format(field.value, "HH:mm") : ""}
															onChange={(e) => {
																const [hours, minutes] = e.target.value.split(":");
																const newDate = new Date(field.value);
																newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes));
																field.onChange(newDate);
															}}
														/>
													</div>
												</PopoverContent>
											</Popover>
											<FormDescription>Data e hora em que o turno será iniciado</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="startMileage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Quilometragem Inicial</FormLabel>
											<FormControl>
												<Input
													type="number"
													{...field}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
												/>
											</FormControl>
											<FormDescription>Quilometragem atual do veículo no início do turno</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Despesas Iniciais</CardTitle>
							<CardDescription>Registre despesas no início do turno (ex: abastecimento)</CardDescription>
						</CardHeader>
						<CardContent>
							{expenses.length > 0 ? (
								<div className="space-y-4">
									{expenses.map((expense: any) => (
										<div key={expense.id} className="flex items-center justify-between p-3 border rounded-md">
											<div>
												<p className="font-medium">
													{expense.category === ExpenseCategory.FUEL
														? "Combustível"
														: expense.category === ExpenseCategory.FOOD
															? "Alimentação"
															: expense.category === ExpenseCategory.MAINTENANCE
																? "Manutenção"
																: expense.category === ExpenseCategory.PARKING
																	? "Estacionamento"
																	: expense.category === ExpenseCategory.TOLL
																		? "Pedágio"
																		: "Outros"}
												</p>
												<p className="text-sm text-muted-foreground">
													€{expense.amount.toFixed(2)} {expense.description && `- ${expense.description}`}
												</p>
											</div>
											<Button variant="ghost" size="sm" onClick={() => handleRemoveExpense(expense.id)}>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-4 text-muted-foreground">Nenhuma despesa registrada</div>
							)}

							{showExpenseForm ? (
								<div className="mt-4 p-4 border rounded-md">
									<ExpenseForm onAdd={handleAddExpense} onCancel={() => setShowExpenseForm(false)} />
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									className="mt-4 w-full"
									onClick={() => setShowExpenseForm(true)}
								>
									<Plus className="mr-2 h-4 w-4" />
									Adicionar Despesa
								</Button>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Rendimentos Iniciais</CardTitle>
							<CardDescription>Registre rendimentos no início do turno (se aplicável)</CardDescription>
						</CardHeader>
						<CardContent>
							{incomes.length > 0 ? (
								<div className="space-y-4">
									{incomes.map((income: any) => (
										<div key={income.id} className="flex items-center justify-between p-3 border rounded-md">
											<div>
												<p className="font-medium">
													{income.platform === PlatformType.UBER
														? "Uber"
														: income.platform === PlatformType.BOLT
															? "Bolt"
															: "Gorjetas"}
												</p>
												<p className="text-sm text-muted-foreground">
													€{income.amount.toFixed(2)} - {income.tripCount} viagens
													{income.description && ` - ${income.description}`}
												</p>
											</div>
											<Button variant="ghost" size="sm" onClick={() => handleRemoveIncome(income.id)}>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-4 text-muted-foreground">Nenhum rendimento registrado</div>
							)}

							{showIncomeForm ? (
								<div className="mt-4 p-4 border rounded-md">
									<IncomeForm onAdd={handleAddIncome} onCancel={() => setShowIncomeForm(false)} />
								</div>
							) : (
								<Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setShowIncomeForm(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Adicionar Rendimento
								</Button>
							)}
						</CardContent>
					</Card>

					<div className="flex justify-end space-x-4">
						<Button type="button" variant="outline" onClick={() => router.back()}>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
									Iniciando...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Iniciar Turno
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
