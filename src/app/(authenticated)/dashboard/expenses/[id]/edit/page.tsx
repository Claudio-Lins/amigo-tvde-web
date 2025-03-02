"use client";

import { getExpenseById, updateExpense } from "@/actions/expense-actions";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof expenseSchema>;

export default function EditExpensePage() {
	const router = useRouter();
	const params = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			date: new Date(),
			amount: undefined,
			category: ExpenseCategory.OTHER,
			notes: "",
			weeklyPeriodId: "",
		},
	});

	useEffect(() => {
		async function loadExpense() {
			try {
				setIsLoading(true);
				const result = await getExpenseById(params.id as string);

				if (result && !("error" in result)) {
					const expenseDate = result.expense.date ? new Date(result.expense.date) : new Date();

					form.reset({
						date: expenseDate,
						amount: result.expense.amount,
						category: result.expense.category as ExpenseCategory,
						notes: result.expense.notes || "",
						weeklyPeriodId: result.expense.weeklyPeriodId || undefined,
					});
				} else {
					toast.error(result?.error || "Erro ao carregar despesa");
					router.push("/dashboard/expenses");
				}
			} catch (error) {
				console.error("Erro ao carregar despesa:", error);
				toast.error("Erro ao carregar despesa");
				router.push("/dashboard/expenses");
			} finally {
				setIsLoading(false);
			}
		}

		loadExpense();
	}, [params.id, router, form]);

	async function onSubmit(data: FormData) {
		setIsSubmitting(true);
		try {
			const result = await updateExpense(params.id as string, data);

			if (result && result.success) {
				toast.success("Despesa atualizada com sucesso");
				router.push("/dashboard/expenses");
			} else {
				toast.error(result?.error || "Erro ao atualizar despesa");
			}
		} catch (error) {
			console.error("Erro ao atualizar despesa:", error);
			toast.error("Erro ao atualizar despesa");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="container py-6">
			<div className="flex items-center gap-4 mb-6">
				<Button variant="outline" size="icon" asChild>
					<Link href="/dashboard/expenses">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-3xl font-bold">Editar Despesa</h1>
			</div>

			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>Informações da Despesa</CardTitle>
					<CardDescription>Atualize os dados da despesa selecionada.</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
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
														selected={
															field.value instanceof Date && !Number.isNaN(field.value.getTime())
																? field.value
																: undefined
														}
														onSelect={field.onChange}
														disabled={(date) => date > new Date()}
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
													<SelectItem value={ExpenseCategory.FUEL}>Combustível</SelectItem>
													<SelectItem value={ExpenseCategory.FOOD}>Alimentação</SelectItem>
													<SelectItem value={ExpenseCategory.MAINTENANCE}>Manutenção</SelectItem>
													<SelectItem value={ExpenseCategory.PARKING}>Estacionamento</SelectItem>
													<SelectItem value={ExpenseCategory.TOLL}>Pedágio</SelectItem>
													<SelectItem value={ExpenseCategory.RENT}>Aluguel</SelectItem>
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
													{...field}
													type="number"
													min={0}
													step={0.01}
													onChange={(e) => field.onChange(Number(e.target.value))}
													value={field.value === undefined ? "" : field.value}
												/>
											</FormControl>
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
													placeholder="Detalhes adicionais sobre a despesa"
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
											Atualizando...
										</>
									) : (
										"Atualizar Despesa"
									)}
								</Button>
							</form>
						</Form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
