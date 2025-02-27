"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, Car, Edit, Fuel, MapPin, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function DailyEntryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter();
	const [entry, setEntry] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);

	// Desembrulhar a Promise params
	const resolvedParams = use(params);
	const entryId = resolvedParams.id;

	useEffect(() => {
		// Simular carregamento de dados da API
		setTimeout(() => {
			// Dados de exemplo para a entrada específica
			const entryData = {
				id: entryId,
				date: "2023-06-15",
				initialMileage: 12500,
				finalMileage: 12620,
				fuelType: "electric",
				fuelConsumption: 16.5,
				fuelCost: 15.0,
				uberEarnings: 75.0,
				boltEarnings: 20.0,
				notes: "Dia com tráfego moderado. Algumas corridas longas para o aeroporto.",
				createdAt: "2023-06-15T20:30:00Z",
				updatedAt: "2023-06-15T20:30:00Z",
			};

			setEntry(entryData);
			setIsLoading(false);
		}, 500);
	}, [entryId]);

	// Calcular valores derivados
	const distance = entry ? entry.finalMileage - entry.initialMileage : 0;
	const totalEarnings = entry ? entry.uberEarnings + entry.boltEarnings : 0;
	const netEarnings = entry ? totalEarnings - entry.fuelCost : 0;
	const costPerKm = distance > 0 ? entry?.fuelCost / distance : 0;

	// Função para formatar valores monetários
	function formatCurrency(value: number) {
		return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
	}

	// Função para formatar datas
	function formatDate(dateString: string) {
		return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
	}

	// Função para obter o texto do tipo de combustível
	function getFuelTypeText(type: string) {
		const types = {
			electric: "Elétrico",
			gasoline: "Gasolina",
			diesel: "Diesel",
			hybrid: "Híbrido",
		};
		return types[type as keyof typeof types] || type;
	}

	// Função para obter a unidade de consumo
	function getConsumptionUnit(type: string) {
		return type === "electric" ? "kWh/100km" : "L/100km";
	}

	// Função para lidar com a exclusão da entrada
	function handleDelete() {
		setIsDeleting(true);

		// Aqui você faria a chamada à API para excluir a entrada
		console.log(`Excluindo entrada ${entryId}`);

		// Simular um atraso de rede
		setTimeout(() => {
			setIsDeleting(false);
			// Redirecionar para a página de listagem após a exclusão bem-sucedida
			router.push("/dashboard/daily-entries");
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

	if (!entry) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh]">
				<h2 className="text-xl font-semibold mb-2">Entrada não encontrada</h2>
				<p className="text-muted-foreground mb-4">A entrada que você está procurando não existe ou foi removida.</p>
				<Link href="/dashboard/daily-entries">
					<Button>Voltar para a lista</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center">
					<Link href="/dashboard/daily-entries" className="mr-4">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<h1 className="text-2xl font-bold">Detalhes da Entrada</h1>
				</div>
				<div className="flex space-x-2">
					<Link href={`/dashboard/daily-entries/${entryId}/edit`}>
						<Button variant="outline" size="sm">
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</Button>
					</Link>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm">
								<Trash className="h-4 w-4 mr-2" />
								Excluir
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Tem certeza?</AlertDialogTitle>
								<AlertDialogDescription>
									Esta ação não pode ser desfeita. Isso excluirá permanentemente esta entrada diária.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Excluindo..." : "Sim, excluir"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Informações Básicas</CardTitle>
						<CardDescription>Detalhes da jornada de trabalho</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center">
							<Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
							<span className="text-sm text-muted-foreground mr-2">Data:</span>
							<span className="font-medium">{formatDate(entry.date)}</span>
						</div>

						<div className="flex items-center">
							<MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
							<span className="text-sm text-muted-foreground mr-2">Quilometragem:</span>
							<span className="font-medium">
								{entry.initialMileage} km → {entry.finalMileage} km
							</span>
						</div>

						<div className="flex items-center">
							<Car className="h-4 w-4 mr-2 text-muted-foreground" />
							<span className="text-sm text-muted-foreground mr-2">Distância Percorrida:</span>
							<span className="font-medium">{distance} km</span>
						</div>

						<div className="flex items-center">
							<Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
							<span className="text-sm text-muted-foreground mr-2">Tipo de Combustível:</span>
							<span className="font-medium">{getFuelTypeText(entry.fuelType)}</span>
						</div>

						<div className="flex items-center">
							<span className="text-sm text-muted-foreground mr-2 ml-6">Consumo:</span>
							<span className="font-medium">
								{entry.fuelConsumption} {getConsumptionUnit(entry.fuelType)}
							</span>
						</div>

						<div className="flex items-center">
							<span className="text-sm text-muted-foreground mr-2 ml-6">Custo:</span>
							<span className="font-medium">{formatCurrency(entry.fuelCost)}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ganhos e Resultados</CardTitle>
						<CardDescription>Resumo financeiro da jornada</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">Ganhos Uber:</span>
							<span className="font-medium">{formatCurrency(entry.uberEarnings)}</span>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">Ganhos Bolt:</span>
							<span className="font-medium">{formatCurrency(entry.boltEarnings)}</span>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">Total de Ganhos:</span>
							<span className="font-medium">{formatCurrency(totalEarnings)}</span>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">Custos:</span>
							<span className="font-medium">{formatCurrency(entry.fuelCost)}</span>
						</div>

						<Separator className="my-2" />

						<div className="flex justify-between items-center">
							<span className="text-sm font-medium">Ganho Líquido:</span>
							<span className="font-bold">{formatCurrency(netEarnings)}</span>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">Custo por km:</span>
							<span className="font-medium">{formatCurrency(costPerKm)}/km</span>
						</div>

						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">Ganho por km:</span>
							<span className="font-medium">{formatCurrency(netEarnings / distance)}/km</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{entry.notes && (
				<Card>
					<CardHeader>
						<CardTitle>Notas</CardTitle>
					</CardHeader>
					<CardContent>
						<p>{entry.notes}</p>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardContent className="pt-6">
					<div className="text-xs text-muted-foreground">
						<div>Criado em: {format(parseISO(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
						<div>
							Última atualização: {format(parseISO(entry.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
