"use client";

import { getFuelConsumptionByVehicle } from "@/actions/fuel-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Fuel, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function ConsumptionDashboardPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<any>(null);

	useEffect(() => {
		async function loadData() {
			try {
				setIsLoading(true);
				const result = await getFuelConsumptionByVehicle();

				if (result.success) {
					setData(result.vehicles);
				} else {
					toast.error(result.error || "Erro ao carregar dados de consumo");
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", JSON.stringify(error, null, 2));
				toast.error("Erro ao carregar dados de consumo");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, []);

	if (isLoading) {
		return (
			<div className="container py-10">
				<h1 className="text-2xl font-bold mb-6">Dashboard de Consumo</h1>
				<Card>
					<CardHeader>
						<CardTitle>Carregando dados...</CardTitle>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="container py-10">
				<h1 className="text-2xl font-bold mb-6">Dashboard de Consumo</h1>
				<Card>
					<CardHeader>
						<CardTitle>Sem dados disponíveis</CardTitle>
						<CardDescription>Não há registros de combustível para exibir no dashboard.</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	// Preparar dados para os gráficos
	const fuelAmountData = data.map((vehicle: any, index: number) => ({
		name: vehicle.name,
		value: Number.parseFloat(vehicle.totalFuelAmount.toFixed(2)),
		color: COLORS[index % COLORS.length],
	}));

	const fuelCostData = data.map((vehicle: any, index: number) => ({
		name: vehicle.name,
		value: Number.parseFloat(vehicle.totalFuelCost.toFixed(2)),
		color: COLORS[index % COLORS.length],
	}));

	return (
		<div className="container py-10">
			<h1 className="text-2xl font-bold mb-6">Dashboard de Consumo</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Fuel className="mr-2 h-5 w-5" />
							Consumo de Combustível por Veículo
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={fuelAmountData}
										cx="50%"
										cy="50%"
										labelLine={false}
										outerRadius={80}
										fill="#8884d8"
										dataKey="value"
										label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
									>
										{fuelAmountData.map((entry: any, index: number) => (
											<Cell key={`cell-${entry.name}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip formatter={(value) => `${value} L`} />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<TrendingDown className="mr-2 h-5 w-5" />
							Custo de Combustível por Veículo
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={fuelCostData}
										cx="50%"
										cy="50%"
										labelLine={false}
										outerRadius={80}
										fill="#8884d8"
										dataKey="value"
										label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
									>
										{fuelCostData.map((entry: any, index: number) => (
											<Cell key={`cell-${entry.name}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip formatter={(value) => `${value} €`} />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
