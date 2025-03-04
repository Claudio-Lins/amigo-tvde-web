import { addFuelRecord } from "@/actions/fuel-records";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Schema de validação para o formulário
const fuelRecordSchema = z.object({
	date: z.string().min(1, "A data é obrigatória"),
	odometer: z.string().min(1, "Odômetro é obrigatório"),
	fuelAmount: z.string().min(1, "Quantidade de combustível é obrigatória"),
	pricePerUnit: z.string().min(1, "Preço por litro é obrigatório"),
	totalPrice: z.string().min(1, "Preço total é obrigatório"),
	fullTank: z.boolean().default(true),
	notes: z.string().optional(),
});

type FuelRecordFormValues = z.infer<typeof fuelRecordSchema>;

interface FuelRecordFormProps {
	userId: string;
	vehicleId: string;
}

export function FuelRecordForm({ userId, vehicleId }: FuelRecordFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();

	// Configuração do formulário com React Hook Form e Zod
	const form = useForm<FuelRecordFormValues>({
		resolver: zodResolver(fuelRecordSchema),
		defaultValues: {
			date: new Date().toISOString().split("T")[0],
			odometer: "",
			fuelAmount: "",
			pricePerUnit: "",
			totalPrice: "",
			fullTank: true,
			notes: "",
		},
	});

	// Função auxiliar para calcular o preço total
	function calculateTotalPrice(fuelAmount: string, pricePerUnit: string) {
		const amount = Number.parseFloat(fuelAmount);
		const price = Number.parseFloat(pricePerUnit);

		if (!Number.isNaN(amount) && !Number.isNaN(price)) {
			const total = (amount * price).toFixed(2);
			form.setValue("totalPrice", total);
		}
	}

	// Handler para quando o campo de quantidade de combustível muda
	function handleFuelAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
		const fuelAmount = e.target.value;
		form.setValue("fuelAmount", fuelAmount);
		calculateTotalPrice(fuelAmount, form.getValues("pricePerUnit"));
	}

	// Handler para quando o campo de preço por litro muda
	function handlePricePerUnitChange(e: React.ChangeEvent<HTMLInputElement>) {
		const pricePerUnit = e.target.value;
		form.setValue("pricePerUnit", pricePerUnit);
		calculateTotalPrice(form.getValues("fuelAmount"), pricePerUnit);
	}

	// Função de submissão do formulário
	async function onSubmit(data: FuelRecordFormValues) {
		try {
			setIsSubmitting(true);

			const result = await addFuelRecord({
				date: new Date(data.date),
				odometer: data.odometer,
				fuelAmount: data.fuelAmount,
				pricePerUnit: data.pricePerUnit,
				totalPrice: data.totalPrice,
				fullTank: data.fullTank,
				notes: data.notes,
				userId,
				vehicleId,
			});

			toast({
				title: "Sucesso!",
				description: "Registro de combustível adicionado com sucesso.",
				variant: "default",
			});

			// Resetar o formulário, mas manter a data atual
			form.reset({
				date: new Date().toISOString().split("T")[0],
				odometer: "",
				fuelAmount: "",
				pricePerUnit: "",
				totalPrice: "",
				fullTank: true,
				notes: "",
			});
		} catch (error) {
			console.error("Erro ao salvar:", JSON.stringify(error, null, 2));

			toast({
				title: "Erro",
				description:
					"Não foi possível adicionar o registro de combustível. Verifique se existe um período semanal para a data selecionada.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Adicionar Abastecimento</CardTitle>
				<CardDescription>
					Registre um abastecimento de combustível. O valor será automaticamente adicionado como despesa.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Data</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="odometer"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Odômetro (km)</FormLabel>
										<FormControl>
											<Input type="number" step="0.1" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="fuelAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Quantidade (litros)</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} onChange={handleFuelAmountChange} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="pricePerUnit"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Preço por litro (€)</FormLabel>
										<FormControl>
											<Input type="number" step="0.001" {...field} onChange={handlePricePerUnitChange} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="totalPrice"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Valor Total (€)</FormLabel>
									<FormControl>
										<Input type="number" step="0.01" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="fullTank"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Tanque Completo</FormLabel>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
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
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" disabled={isSubmitting} className="w-full">
							{isSubmitting ? "Salvando..." : "Adicionar Abastecimento"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
