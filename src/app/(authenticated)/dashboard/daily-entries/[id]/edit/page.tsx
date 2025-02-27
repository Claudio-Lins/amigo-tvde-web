"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Esquema de validação com Zod (igual ao da página de nova entrada)
const formSchema = z
	.object({
		date: z.string().min(1, { message: "A data é obrigatória" }),
		initialMileage: z.coerce.number().min(0, { message: "A quilometragem inicial deve ser um número positivo" }),
		finalMileage: z.coerce.number().min(0, { message: "A quilometragem final deve ser um número positivo" }),
		fuelType: z.enum(["gasoline", "diesel", "electric", "hybrid"], {
			message: "Selecione um tipo de combustível válido",
		}),
		fuelConsumption: z.coerce.number().min(0, { message: "O consumo deve ser um número positivo" }),
		fuelCost: z.coerce.number().min(0, { message: "O custo deve ser um número positivo" }),
		uberEarnings: z.coerce.number().min(0, { message: "Os ganhos devem ser um número positivo" }),
		boltEarnings: z.coerce.number().min(0, { message: "Os ganhos devem ser um número positivo" }),
		notes: z.string().optional(),
	})
	.refine((data) => data.finalMileage >= data.initialMileage, {
		message: "A quilometragem final deve ser maior ou igual à quilometragem inicial",
		path: ["finalMileage"],
	});

export default function EditDailyEntryPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Desembrulhar a Promise params usando React.use()
	const resolvedParams = use(params);
	const entryId = resolvedParams.id;

	// Configurar o formulário com React Hook Form e Zod
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			date: "",
			initialMileage: 0,
			finalMileage: 0,
			fuelType: "electric",
			fuelConsumption: 0,
			fuelCost: 0,
			uberEarnings: 0,
			boltEarnings: 0,
			notes: "",
		},
	});

	// Preencher o formulário com os dados existentes
	useEffect(() => {
		// Simular carregamento de dados
		setTimeout(() => {
			// Definir os dados dentro do useEffect para evitar dependências
			const entryData = {
				id: entryId,
				date: "2023-06-15",
				initialMileage: 12500,
				finalMileage: 12620,
				fuelType: "electric" as const,
				fuelConsumption: 16.5,
				fuelCost: 15.0,
				uberEarnings: 75.0,
				boltEarnings: 20.0,
				notes: "Dia com tráfego moderado. Algumas corridas longas para o aeroporto.",
				createdAt: "2023-06-15T20:30:00Z",
				updatedAt: "2023-06-15T20:30:00Z",
			};

			form.reset({
				date: entryData.date,
				initialMileage: entryData.initialMileage,
				finalMileage: entryData.finalMileage,
				fuelType: entryData.fuelType,
				fuelConsumption: entryData.fuelConsumption,
				fuelCost: entryData.fuelCost,
				uberEarnings: entryData.uberEarnings,
				boltEarnings: entryData.boltEarnings,
				notes: entryData.notes || "",
			});
			setIsLoading(false);
		}, 500);
	}, [form, entryId]);

	// Calcular valores derivados
	const watchInitialMileage = form.watch("initialMileage") || 0;
	const watchFinalMileage = form.watch("finalMileage") || 0;
	const watchUberEarnings = form.watch("uberEarnings") || 0;
	const watchBoltEarnings = form.watch("boltEarnings") || 0;
	const watchFuelCost = form.watch("fuelCost") || 0;

	const distance = Math.max(0, Number(watchFinalMileage) - Number(watchInitialMileage));
	const totalEarnings = Number(watchUberEarnings) + Number(watchBoltEarnings);
	const netEarnings = totalEarnings - Number(watchFuelCost);
	const costPerKm = distance > 0 ? Number(watchFuelCost) / distance : 0;

	// Função para lidar com o envio do formulário
	function onSubmit(values: z.infer<typeof formSchema>) {
		setIsSubmitting(true);

		// Aqui você adicionaria a lógica para atualizar os dados no banco de dados
		console.log(JSON.stringify(values, null, 2));

		// Simular um atraso de rede
		setTimeout(() => {
			setIsSubmitting(false);
			// Redirecionar para a página de detalhes após o envio bem-sucedido
			router.push(`/dashboard/daily-entries/${entryId}`);
		}, 1000);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[50vh]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
					<p className="mt-2 text-sm text-muted-foreground">Carregando dados...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center">
				<Link href={`/dashboard/daily-entries/${entryId}`} className="mr-4">
					<Button variant="ghost" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<h1 className="text-2xl font-bold">Editar Entrada Diária</h1>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Informações Básicas</CardTitle>
							<CardDescription>Atualize os detalhes da sua jornada de trabalho</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
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

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="initialMileage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Quilometragem Inicial (km)</FormLabel>
											<FormControl>
												<Input type="number" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="finalMileage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Quilometragem Final (km)</FormLabel>
											<FormControl>
												<Input type="number" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="fuelType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Combustível</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o tipo de combustível" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="electric">Elétrico</SelectItem>
												<SelectItem value="gasoline">Gasolina</SelectItem>
												<SelectItem value="diesel">Diesel</SelectItem>
												<SelectItem value="hybrid">Híbrido</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="fuelConsumption"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Consumo</FormLabel>
											<FormControl>
												<Input type="number" step="0.1" {...field} />
											</FormControl>
											<FormDescription>
												{form.watch("fuelType") === "electric" ? "kWh/100km" : "L/100km"}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fuelCost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Custo de Recarga/Combustível</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Ganhos e Custos</CardTitle>
							<CardDescription>Atualize os valores financeiros da sua jornada</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="uberEarnings"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ganhos Uber (€)</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
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
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notas</FormLabel>
										<FormControl>
											<textarea
												className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
												placeholder="Adicione notas ou observações sobre o dia..."
												{...field}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Resumo</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Distância Percorrida:</span>
									<span className="font-medium">{distance} km</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Total de Ganhos:</span>
									<span className="font-medium">
										€{typeof totalEarnings === "number" ? totalEarnings.toFixed(2) : "0.00"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Custos:</span>
									<span className="font-medium">
										€{typeof watchFuelCost === "number" ? watchFuelCost.toFixed(2) : "0.00"}
									</span>
								</div>
								<Separator className="my-2" />
								<div className="flex justify-between">
									<span className="text-muted-foreground">Ganho Líquido:</span>
									<span className="font-medium">
										€{typeof netEarnings === "number" ? netEarnings.toFixed(2) : "0.00"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Custo por km:</span>
									<span className="font-medium">
										€{typeof costPerKm === "number" ? costPerKm.toFixed(2) : "0.00"}/km
									</span>
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Link href={`/dashboard/daily-entries/${entryId}`}>
								<Button variant="outline">Cancelar</Button>
							</Link>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									"Salvando..."
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Salvar Alterações
									</>
								)}
							</Button>
						</CardFooter>
					</Card>
				</form>
			</Form>
		</div>
	);
}
