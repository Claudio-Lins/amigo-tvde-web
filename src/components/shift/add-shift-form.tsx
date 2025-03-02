"use client";

import { createShift } from "@/actions/shift-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { shiftSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface AddShiftFormProps {
	weeklyPeriodId: string;
	startDate: Date;
	endDate: Date;
}

type FormData = z.infer<typeof shiftSchema>;

export function AddShiftForm({ weeklyPeriodId, startDate, endDate }: AddShiftFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	// Definir a data padrão como hoje, ou a data de início do período se hoje for anterior
	const today = new Date();
	const defaultDate = isBefore(today, new Date(startDate))
		? new Date(startDate)
		: isAfter(today, new Date(endDate))
			? new Date(endDate)
			: today;

	const form = useForm<FormData>({
		resolver: zodResolver(shiftSchema),
		defaultValues: {
			date: defaultDate,
			uberEarnings: 0,
			boltEarnings: 0,
			otherEarnings: 0,
			odometer: 0,
			weeklyPeriodId,
		},
	});

	async function onSubmit(data: FormData) {
		setIsSubmitting(true);

		try {
			const result = await createShift(data);

			if (result && "success" in result) {
				toast.success("Turno registrado com sucesso!");
				router.push(`/dashboard/weekly-periods/${weeklyPeriodId}`);
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

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
										onSelect={field.onChange}
										disabled={(date) =>
											!isWithinInterval(date, {
												start: new Date(startDate),
												end: new Date(endDate),
											})
										}
										initialFocus
										locale={ptBR}
									/>
								</PopoverContent>
							</Popover>
							<FormDescription>
								Selecione a data em que o turno foi realizado. Deve estar dentro do período semanal atual.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

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
									min={0}
									step={0.01}
									onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
								/>
							</FormControl>
							<FormDescription>Valor total ganho na plataforma Uber neste turno.</FormDescription>
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
									min={0}
									step={0.01}
									onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
								/>
							</FormControl>
							<FormDescription>Valor total ganho na plataforma Bolt neste turno.</FormDescription>
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
									min={0}
									step={0.01}
									onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
								/>
							</FormControl>
							<FormDescription>Outros ganhos obtidos durante este turno (gorjetas, etc).</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="odometer"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Quilometragem (km)</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="number"
									min={0}
									step={1}
									onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
								/>
							</FormControl>
							<FormDescription>Quilômetros percorridos durante este turno.</FormDescription>
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
						"Registrar Turno"
					)}
				</Button>
			</form>
		</Form>
	);
}
