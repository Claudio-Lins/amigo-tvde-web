"use client";

import { createWeeklyPeriod } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { weeklyPeriodSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, getDay, getWeek, nextMonday, previousMonday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof weeklyPeriodSchema>;

export function AddWeeklyPeriodForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	// Obter a próxima segunda-feira como data de início padrão
	const today = new Date();
	const defaultStartDate = getDay(today) === 1 ? today : nextMonday(today);
	const defaultEndDate = addDays(defaultStartDate, 6); // Domingo (6 dias depois da segunda)

	// Obter o número da semana para o nome padrão
	const weekNumber = getWeek(defaultStartDate, { locale: ptBR });
	const year = defaultStartDate.getFullYear();

	const form = useForm<FormData>({
		resolver: zodResolver(weeklyPeriodSchema),
		defaultValues: {
			name: `Semana ${weekNumber}/${year}`,
			startDate: defaultStartDate,
			endDate: defaultEndDate,
			weeklyGoal: 400,
			isActive: true,
		},
	});

	async function onSubmit(data: FormData) {
		setIsSubmitting(true);

		try {
			// Garantir que a data de início seja uma segunda-feira
			const startDay = getDay(data.startDate);
			if (startDay !== 1) {
				// Se não for segunda-feira, ajustar para a próxima segunda
				data.startDate = nextMonday(data.startDate);
			}

			// Definir a data de término como 6 dias após a data de início (domingo)
			data.endDate = addDays(data.startDate, 6);

			const result = await createWeeklyPeriod(data);

			if (result && "success" in result) {
				toast.success("Período semanal criado com sucesso!");
				router.push("/dashboard/weekly-periods");
			} else {
				toast.error(result?.error || "Erro ao criar período semanal");
			}
		} catch (error) {
			console.error("Erro ao criar período semanal:", error);
			toast.error("Erro ao criar período semanal");
		} finally {
			setIsSubmitting(false);
		}
	}

	// Função para ajustar a data para a segunda-feira mais próxima
	function handleDateSelect(date: Date, field: any) {
		const day = getDay(date);
		let adjustedDate = date;

		// Se não for segunda-feira (1), ajustar para a segunda-feira mais próxima
		if (day !== 1) {
			// Calcular a diferença para a segunda-feira anterior e próxima
			const prevMondayDiff = getDay(date) === 0 ? 6 : getDay(date) - 1;
			const nextMondayDiff = getDay(date) === 0 ? 1 : 8 - getDay(date);

			// Escolher a segunda-feira mais próxima
			if (prevMondayDiff <= nextMondayDiff) {
				adjustedDate = previousMonday(date);
			} else {
				adjustedDate = nextMonday(date);
			}
		}

		field.onChange(startOfDay(adjustedDate));

		// Atualizar a data de término para 6 dias após a data de início
		const newEndDate = addDays(adjustedDate, 6);
		form.setValue("endDate", newEndDate);

		// Atualizar o nome do período com o número da semana
		const weekNumber = getWeek(adjustedDate, { locale: ptBR });
		const year = adjustedDate.getFullYear();
		form.setValue("name", `Semana ${weekNumber}/${year}`);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome do Período</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormDescription>Um nome para identificar este período semanal.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="startDate"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>Data de Início</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={"outline"}
											className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
										>
											{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value}
										onSelect={(date) => date && handleDateSelect(date, field)}
										disabled={(date) => date < new Date("1900-01-01")}
										initialFocus
										locale={ptBR}
									/>
								</PopoverContent>
							</Popover>
							<FormDescription>
								O período sempre começa em uma segunda-feira. A data será ajustada automaticamente.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="endDate"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>Data de Término</FormLabel>
							<FormControl>
								<Button
									variant={"outline"}
									className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
									disabled
								>
									{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Calculado automaticamente</span>}
									<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
								</Button>
							</FormControl>
							<FormDescription>O período sempre termina no domingo (6 dias após o início).</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="weeklyGoal"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Meta Semanal (€)</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="number"
									// min={0}
									// step={50}
									placeholder="400"
									onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
								/>
							</FormControl>
							<FormDescription>Defina uma meta de ganhos para esta semana.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isActive"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Ativar Período</FormLabel>
								<FormDescription>
									Se ativado, este será o período atual para registro de turnos. Apenas um período pode estar ativo por
									vez.
								</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isSubmitting} className="w-full">
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Criando...
						</>
					) : (
						"Criar Período Semanal"
					)}
				</Button>
			</form>
		</Form>
	);
}
