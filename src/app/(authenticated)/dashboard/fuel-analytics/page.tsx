"use client";

import { getFuelConsumptionByVehicle } from "@/actions/fuel-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FuelType } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, Car, Fuel } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function FuelAnalyticsPage() {
	const [vehicleData, setVehicleData] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadData() {
			try {
				setIsLoading(true);
				const result = await getFuelConsumptionByVehicle();
				if (result && !("error" in result)) {
					setVehicleData(result);
				} else {
					console.error("Erro ao carregar dados de consumo:", result?.error);
					toast.error("Erro ao carregar dados de consumo");
				}
			} catch (error) {
				console.error("Erro ao carregar dados de consumo:", error);
				toast.error("Erro ao carregar dados de consumo");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, []);

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
	}

	function getFuelUnit(fuelType?: FuelType): string {
		return fuelType === "ELECTRIC" ? "kWh" : "L";
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Análise de Combustível</h1>
				<Button variant="outline" asChild>
					<a href="/dashboard/fuel-analytics/by-shift">Ver por Turno</a>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Fuel className="h-5 w-5" />
						<span>Consumo por Veículo</span>
					</CardTitle>
					<CardDescription>Análise de consumo de combustível e eficiência por veículo</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : vehicleData.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Veículo</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead>Distância Total</TableHead>
									<TableHead>Combustível Total</TableHead>
									<TableHead>Custo Total</TableHead>
									<TableHead>Consumo Médio</TableHead>
									<TableHead>Custo/km</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{vehicleData.map((item) => (
									<TableRow key={item.vehicle.id}>
										<TableCell className="font-medium">
											{item.vehicle.brand} {item.vehicle.model}
										</TableCell>
										<TableCell>{translateFuelType(item.vehicle.fuelType)}</TableCell>
										<TableCell>{item.totalDistance.toFixed(0)} km</TableCell>
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
								Nenhum dado de consumo disponível. Registre abastecimentos para visualizar análises.
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
						<span>Estatísticas de Consumo</span>
					</CardTitle>
					<CardDescription>Visão geral das estatísticas de consumo de combustível</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : vehicleData.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{vehicleData.map((item) => (
								<Card key={item.vehicle.id}>
									<CardHeader className="pb-2">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg flex items-center gap-2">
												<Car className="h-4 w-4" />
												<span>
													{item.vehicle.brand} {item.vehicle.model}
												</span>
											</CardTitle>
											<div className="bg-primary/10 text-primary text-xs font-medium py-1 px-2 rounded-full">
												{translateFuelType(item.vehicle.fuelType)}
											</div>
										</div>
										<CardDescription>{item.fuelRecordsCount} abastecimentos registrados</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Distância Total</span>
												<span className="font-medium">{item.totalDistance.toFixed(0)} km</span>
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
								Nenhum dado de consumo disponível. Registre abastecimentos para visualizar estatísticas.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
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
