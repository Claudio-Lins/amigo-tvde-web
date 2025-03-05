"use client";

import { getFuelConsumptionByShift } from "@/actions/fuel-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FuelType } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, Calendar, Car, Fuel } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function FuelAnalyticsByShiftPage() {
	const [shiftData, setShiftData] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadData() {
			try {
				setIsLoading(true);
				const result = await getFuelConsumptionByShift();
				if (result && !("error" in result)) {
					setShiftData(result);
				} else {
					console.error("Erro ao carregar dados de consumo por turno:", result?.error);
					toast.error("Erro ao carregar dados de consumo por turno");
				}
			} catch (error) {
				console.error("Erro ao carregar dados de consumo por turno:", error);
				toast.error("Erro ao carregar dados de consumo por turno");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, []);

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
	}

	function formatDate(date: Date): string {
		return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
	}

	function getFuelUnit(fuelType?: FuelType): string {
		return fuelType === "ELECTRIC" ? "kWh" : "L";
	}

	function translateFuelType(fuelType: FuelType): string {
		const types = {
			ELECTRIC: "Elétrico",
			GASOLINE: "Gasolina",
			DIESEL: "Gasóleo",
			HYBRID: "Híbrido",
		};
		return types[fuelType] || fuelType;
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Análise de Combustível por Turno</h1>
				<Button variant="outline" asChild>
					<a href="/dashboard/fuel-analytics">Ver por Veículo</a>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						<span>Consumo por Turno</span>
					</CardTitle>
					<CardDescription>Análise de consumo de combustível e eficiência por turno de trabalho</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : shiftData.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Veículo</TableHead>
									<TableHead>Distância</TableHead>
									<TableHead>Combustível</TableHead>
									<TableHead>Custo</TableHead>
									<TableHead>Consumo Médio</TableHead>
									<TableHead>Custo/km</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{shiftData.map((item) => (
									<TableRow key={item.shift.id}>
										<TableCell className="font-medium">{formatDate(item.shift.date)}</TableCell>
										<TableCell>
											{item.vehicle.brand} {item.vehicle.model}
										</TableCell>
										<TableCell>{item.distance.toFixed(0)} km</TableCell>
										<TableCell>
											{item.totalFuel.toFixed(2)} {getFuelUnit(item.vehicle.fuelType)}
										</TableCell>
										<TableCell>{formatCurrency(item.totalCost)}</TableCell>
										<TableCell>
											{item.averageConsumption.toFixed(2)} km/{getFuelUnit(item.vehicle.fuelType)}
										</TableCell>
										<TableCell>{formatCurrency(item.costPerKm)}/km</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">
								Nenhum dado de consumo por turno disponível. Registre abastecimentos associados a turnos para visualizar
								análises.
							</p>
							<Button asChild>
								<a href="/dashboard/fuel-records/new">Registrar Abastecimento</a>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						<span>Detalhes por Turno</span>
					</CardTitle>
					<CardDescription>Detalhes de consumo e eficiência para cada turno</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : shiftData.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{shiftData.map((item) => (
								<Card key={item.shift.id}>
									<CardHeader className="pb-2">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg flex items-center gap-2">
												<Calendar className="h-4 w-4" />
												<span>Turno de {formatDate(item.shift.date)}</span>
											</CardTitle>
											<div className="flex items-center gap-2">
												<Car className="h-4 w-4" />
												<span className="text-sm font-medium">
													{item.vehicle.brand} {item.vehicle.model}
												</span>
											</div>
										</div>
										<CardDescription>{item.fuelRecordsCount} abastecimentos registrados</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Odômetro Inicial</span>
												<span className="font-medium">{item.shift.initialOdometer?.toFixed(0) || "N/A"} km</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Odômetro Final</span>
												<span className="font-medium">{item.shift.finalOdometer?.toFixed(0) || "N/A"} km</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Distância</span>
												<span className="font-medium">{item.distance.toFixed(0)} km</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Combustível Total</span>
												<span className="font-medium">
													{item.totalFuel.toFixed(2)} {getFuelUnit(item.vehicle.fuelType)}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Custo Total</span>
												<span className="font-medium">{formatCurrency(item.totalCost)}</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Consumo Médio</span>
												<span className="font-medium">
													{item.averageConsumption.toFixed(2)} km/{getFuelUnit(item.vehicle.fuelType)}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Custo por km</span>
												<span className="font-medium">{formatCurrency(item.costPerKm)}/km</span>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								Nenhum dado de consumo por turno disponível. Registre abastecimentos associados a turnos para visualizar
								estatísticas.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
