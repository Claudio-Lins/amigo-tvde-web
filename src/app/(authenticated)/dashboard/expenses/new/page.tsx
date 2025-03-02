"use client";

import { createExpense } from "@/actions/expense-actions";
import { getWeeklyPeriodById } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { expenseSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseCategory } from "@prisma/client";
import { format, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof expenseSchema>;

// Função auxiliar para traduzir categorias de despesa
function translateExpenseCategory(category: ExpenseCategory): string {
	const translations: Record<string, string> = {
		FUEL: "Combustível",
		FOOD: "Alimentação",
		MAINTENANCE: "Manutenção",
		PARKING: "Estacionamento",
		TOLL: "Pedágio",
		OTHER: "Outros",
	};

	return translations[category] || category;
}

export default function NewExpensePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const periodId = searchParams.get("periodId");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [weeklyPeriod, setWeeklyPeriod] = useState<any>(null);

	const form = useForm<FormData>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			date: new Date(),
			amount: 0,
			category: ExpenseCategory.FUEL,
			notes: "",
			weeklyPeriodId: periodId || "",
		},
	});

	useEffect(() => {
		async function loadWeeklyPeriod() {
			if (!periodId) {
				setIsLoading(false);
				return;
			}

			try {
				const result = await getWeeklyPeriodById(periodId);

				if (result && !("error" in result)) {
					setWeeklyPeriod(result);
					form.setValue("weeklyPeriodId", result.id);
				} else {
					toast.error(result?.error || "Erro ao carregar período semanal");
					router.push("/dashboard/weekly-periods");
				}
			} catch (error) {
				console.error("Erro ao carregar período semanal:", error);
				toast.error("Erro ao carregar período semanal");
				router.push("/dashboard/weekly-periods");
			} finally {
				setIsLoading(false);
			}
		}

		loadWeeklyPeriod();
	}, [periodId, router, form]);

	async function onSubmit(data: FormData) {
		setIsSubmitting(true);

		try {
			const result = await createExpense(data);

			if (result && "success" in result) {
				toast.success("Despesa registrada com sucesso!");
				router.push(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
			} else {
				toast.error(result?.error || "Erro ao registrar despesa");
			}
		} catch (error) {
			console.error("Erro ao registrar despesa:", error);
			toast.error("Erro ao registrar despesa");
		} finally {
			setIsSubmitting(false);
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
		<div className="container py-10">
			<div className="max-w-md mx-auto">
				<div className="mb-6">
					<Button variant="ghost" size="sm" asChild className="mb-2">
						<Link href={`/dashboard/weekly-periods/${periodId}`}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar
						</Link>
					</Button>
					<h1 className="text-2xl font-bold">Registrar Nova Despesa</h1>
					<p className="text-muted-foreground">Adicione uma nova despesa ao período {weeklyPeriod?.name || ""}.</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Detalhes da Despesa</CardTitle>
						<CardDescription>Preencha os dados da despesa abaixo.</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
															className={cn(
																"w-full pl-3 text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value && field.value instanceof Date && !Number.isNaN(field.value.getTime()) ? (
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
														locale={ptBR}
													/>
												</PopoverContent>
											</Popover>
											<FormDescription>
												Selecione a data da despesa. Deve estar dentro do período semanal.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Categoria</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione uma categoria" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{Object.values(ExpenseCategory).map((category) => (
														<SelectItem key={category} value={category}>
															{translateExpenseCategory(category)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>Selecione a categoria da despesa.</FormDescription>
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
													{...field}
													type="number"
													min={0.01}
													step={0.01}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
												/>
											</FormControl>
											<FormDescription>Valor da despesa em reais.</FormDescription>
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
												<Textarea {...field} placeholder="Detalhes adicionais sobre a despesa (opcional)" />
											</FormControl>
											<FormDescription>Adicione informações adicionais sobre a despesa (opcional).</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button type="submit" disabled={isSubmitting} className="w-full">
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Registrando...
										</>
									) : (
										"Registrar Despesa"
									)}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
