"use client";

import { getFuelRecordsByVehicle } from "@/actions/fuel-actions";
import { getVehicles } from "@/actions/vehicle-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	calculateAverageConsumption,
	calculateConsumptionTrend,
	calculateCostPerKm,
	getConsumptionUnit,
	getPriceUnit,
} from "@/utils/fuel-calculations";
import { FuelType } from "@prisma/client";
import { ArrowLeft, DropletIcon, LineChart, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

function formatNumber(value: number, decimals = 2): string {
	return value?.toFixed(decimals);
}

export default function ConsumptionDashboardPage() {
	const [vehicles, setVehicles] = useState<any[]>([]);
	const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
	const [fuelRecords, setFuelRecords] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

	useEffect(() => {
		async function loadVehicles() {
			try {
				setIsLoading(true);
				const vehiclesData = await getVehicles();
				if (vehiclesData && !("error" in vehiclesData) && vehiclesData.length > 0) {
					setVehicles(vehiclesData);
					setSelectedVehicleId(vehiclesData[0].id);
				}
			} catch (error) {
				console.error("Erro ao carregar veículos:", error);
				toast.error("Erro ao carregar veículos");
			} finally {
				setIsLoading(false);
			}
		}

		loadVehicles();
	}, []);

	useEffect(() => {
		async function loadFuelRecords() {
			if (!selectedVehicleId) return;

			try {
				setIsLoading(true);
				const result = await getFuelRecordsByVehicle(selectedVehicleId);
				if (result.success) {
					setFuelRecords(result.fuelRecords);

					// Encontrar o veículo selecionado
					const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
					setSelectedVehicle(vehicle);
				} else {
					toast.error(result.error || "Erro ao carregar registros de combustível");
				}
			} catch (error) {
				console.error("Erro ao carregar registros de combustível:", error);
				toast.error("Erro ao carregar registros de combustível");
			} finally {
				setIsLoading(false);
			}
		}

		loadFuelRecords();
	}, [selectedVehicleId, vehicles]);

	const avgConsumption = calculateAverageConsumption(fuelRecords);
	const costPerKm = calculateCostPerKm(fuelRecords);
	const consumptionTrend = calculateConsumptionTrend(fuelRecords);

	const consumptionUnit = selectedVehicle ? getConsumptionUnit(selectedVehicle.fuelType) : "L/100km";
	const priceUnit = selectedVehicle ? getPriceUnit(selectedVehicle.fuelType) : "L";

	return (
		<div className="container py-6">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center">
					<Button variant="ghost" size="sm" className="mr-2" asChild>
						<Link href="/dashboard">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar
						</Link>
					</Button>
					<h1 className="text-2xl font-bold">Dashboard de Consumo</h1>
				</div>
				<Button asChild>
					<Link href="/dashboard/fuel-records/new">
						<DropletIcon className="h-4 w-4 mr-2" />
						Novo Registro
					</Link>
				</Button>
			</div>

			<div className="mb-6">
				<Select
					value={selectedVehicleId}
					onValueChange={setSelectedVehicleId}
					disabled={isLoading || vehicles.length === 0}
				>
					<SelectTrigger className="w-full md:w-[300px]">
						<SelectValue placeholder="Selecione um veículo" />
					</SelectTrigger>
					<SelectContent>
						{vehicles.map((vehicle) => (
							<SelectItem key={vehicle.id} value={vehicle.id}>
								{vehicle.make} {vehicle.model} ({vehicle.year})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{selectedVehicle && fuelRecords.length > 0 ? (
				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="mb-4">
						<TabsTrigger value="overview">Visão Geral</TabsTrigger>
						<TabsTrigger value="history">Histórico</TabsTrigger>
						<TabsTrigger value="charts">Gráficos</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">Consumo Médio</CardTitle>
									<CardDescription>Baseado em {fuelRecords.length} registros</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										<DropletIcon className="h-4 w-4 inline mr-1" />
										{formatNumber(avgConsumption)} {consumptionUnit}
									</div>
									<p className="text-xs text-muted-foreground">
										{consumptionTrend > 0 ? (
											<span className="text-red-500 flex items-center">
												<TrendingUp className="h-3 w-3 mr-1" />
												{formatNumber(consumptionTrend, 1)}% acima da média anterior
											</span>
										) : consumptionTrend < 0 ? (
											<span className="text-green-500 flex items-center">
												<TrendingDown className="h-3 w-3 mr-1" />
												{formatNumber(Math.abs(consumptionTrend), 1)}% abaixo da média anterior
											</span>
										) : (
											<span>Sem variação significativa</span>
										)}
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">Custo por Km</CardTitle>
									<CardDescription>Custo médio por quilômetro</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{formatCurrency(costPerKm)}/km</div>
									<p className="text-xs text-muted-foreground">Equivalente a {formatCurrency(costPerKm * 100)}/100km</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
									<CardDescription>Preço médio por {priceUnit}</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatCurrency(fuelRecords.reduce((sum, record) => sum + record.price, 0) / fuelRecords.length)}/
										{priceUnit}
									</div>
									<p className="text-xs text-muted-foreground">
										Baseado nos últimos {fuelRecords.length} abastecimentos
									</p>
								</CardContent>
							</Card>
						</div>

						<div className="mt-4">
							<Card>
								<CardHeader>
									<CardTitle>Resumo de Consumo</CardTitle>
									<CardDescription>
										{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
											<div>
												<h3 className="text-sm font-medium">Total Abastecido</h3>
												<p className="text-xl">
													{formatNumber(
														fuelRecords.reduce((sum, record) => sum + record.amount, 0),
														1,
													)}{" "}
													{priceUnit}
												</p>
											</div>
											<div>
												<h3 className="text-sm font-medium">Gasto Total</h3>
												<p className="text-xl">
													{formatCurrency(fuelRecords.reduce((sum, record) => sum + record.totalCost, 0))}
												</p>
											</div>
											<div>
												<h3 className="text-sm font-medium">Distância Total</h3>
												<p className="text-xl">
													{formatNumber(
														fuelRecords.length > 1
															? Math.max(...fuelRecords.map((r) => r.odometer)) -
																	Math.min(...fuelRecords.map((r) => r.odometer))
															: 0,
													)}{" "}
													km
												</p>
											</div>
											<div>
												<h3 className="text-sm font-medium">Registros</h3>
												<p className="text-xl">{fuelRecords.length}</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="history">
						<Card>
							<CardHeader>
								<CardTitle>Histórico de Abastecimentos</CardTitle>
								<CardDescription>Últimos {fuelRecords.length} abastecimentos</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b">
												<th className="text-left py-2">Data</th>
												<th className="text-left py-2">Odômetro</th>
												<th className="text-left py-2">Quantidade</th>
												<th className="text-left py-2">Preço</th>
												<th className="text-left py-2">Total</th>
												<th className="text-left py-2">Tanque Cheio</th>
											</tr>
										</thead>
										<tbody>
											{fuelRecords
												.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
												.map((record) => (
													<tr key={record.id} className="border-b">
														<td className="py-2">{new Date(record.date).toLocaleDateString("pt-PT")}</td>
														<td className="py-2">{formatNumber(record.odometer, 1)} km</td>
														<td className="py-2">
															{formatNumber(record.amount, 2)} {priceUnit}
														</td>
														<td className="py-2">
															{formatCurrency(record.price)}/{priceUnit}
														</td>
														<td className="py-2">{formatCurrency(record.totalCost)}</td>
														<td className="py-2">{record.fullTank ? "Sim" : "Não"}</td>
													</tr>
												))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="charts">
						<Card>
							<CardHeader>
								<CardTitle>Gráficos de Consumo</CardTitle>
								<CardDescription>Análise visual do consumo</CardDescription>
							</CardHeader>
							<CardContent className="h-[400px] flex items-center justify-center">
								<div className="text-center">
									<LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
									<p>Gráficos serão implementados em breve</p>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			) : (
				<Card>
					<CardContent className="py-10">
						<div className="text-center">
							<DropletIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">Sem dados de consumo</h3>
							<p className="text-muted-foreground mb-4">
								{vehicles.length === 0
									? "Adicione um veículo primeiro para começar a registrar o consumo."
									: "Adicione registros de abastecimento para ver estatísticas de consumo."}
							</p>
							<Button asChild>
								<Link href={vehicles.length === 0 ? "/dashboard/vehicles/new" : "/dashboard/fuel-records/new"}>
									{vehicles.length === 0 ? "Adicionar Veículo" : "Adicionar Abastecimento"}
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
