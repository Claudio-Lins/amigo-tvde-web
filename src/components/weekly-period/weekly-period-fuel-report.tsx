import { getWeeklyPeriodFuelData } from "@/actions/fuel-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, Car, Fuel, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

interface WeeklyPeriodFuelReportProps {
	weeklyPeriodId: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export function WeeklyPeriodFuelReport({ weeklyPeriodId }: WeeklyPeriodFuelReportProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<any>(null);

	useEffect(() => {
		async function loadFuelData() {
			try {
				setIsLoading(true);
				const result = await getWeeklyPeriodFuelData(weeklyPeriodId);

				if (result.success) {
					setData(result);
				} else {
					toast.error(result.error || "Erro ao carregar dados de combustível");
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", JSON.stringify(error, null, 2));
				toast.error("Erro ao carregar dados de combustível");
			} finally {
				setIsLoading(false);
			}
		}

		loadFuelData();
	}, [weeklyPeriodId]);

	if (isLoading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Dados de Combustível</CardTitle>
					<CardDescription>Carregando...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (!data || !data.success) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Dados de Combustível</CardTitle>
					<CardDescription>Nenhum dado disponível</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const { metrics, vehicleSummary, shiftsWithFuel } = data;
	const hasFuelData = metrics.totalFuelAmount > 0;

	// Preparar dados para o gráfico de consumo por veículo
	const vehicleChartData = vehicleSummary.map((vehicle: any, index: number) => ({
		name: vehicle.name,
		value: vehicle.fuelAmount,
		color: COLORS[index % COLORS.length],
	}));

	return (
		<div className="space-y-6">
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center">
						<Fuel className="mr-2 h-5 w-5" />
						Relatório de Combustível
					</CardTitle>
					<CardDescription>{data.weeklyPeriod.name || "Período Semanal"}</CardDescription>
				</CardHeader>
				<CardContent>
					{hasFuelData ? (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
								<Card>
									<CardHeader className="p-4">
										<CardTitle className="text-sm font-medium">Total Combustível</CardTitle>
									</CardHeader>
									<CardContent className="p-4 pt-0">
										<div className="text-2xl font-bold">{metrics.totalFuelAmount.toFixed(2)} L</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="p-4">
										<CardTitle className="text-sm font-medium">Custo Total</CardTitle>
									</CardHeader>
									<CardContent className="p-4 pt-0">
										<div className="text-2xl font-bold">{metrics.totalFuelCost.toFixed(2)} €</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="p-4">
										<CardTitle className="text-sm font-medium">Distância Total</CardTitle>
									</CardHeader>
									<CardContent className="p-4 pt-0">
										<div className="text-2xl font-bold">{metrics.totalDistance.toFixed(1)} km</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="p-4">
										<CardTitle className="text-sm font-medium">Custo por km</CardTitle>
									</CardHeader>
									<CardContent className="p-4 pt-0">
										<div className="text-2xl font-bold">{metrics.costPerKm.toFixed(2)} €/km</div>
									</CardContent>
								</Card>
							</div>

							{vehicleSummary.length > 0 && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center">
												<Car className="mr-2 h-5 w-5" />
												Consumo por Veículo
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="h-64">
												<ResponsiveContainer width="100%" height="100%">
													<PieChart>
														<Pie
															data={vehicleChartData}
															cx="50%"
															cy="50%"
															labelLine={false}
															outerRadius={80}
															fill="#8884d8"
															dataKey="value"
															label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
														>
															{vehicleChartData.map((entry: any) => (
																<Cell key={`cell-${entry.name}`} fill={entry.color} />
															))}
														</Pie>
														<Tooltip formatter={(value) => `${Number(value).toFixed(2)} L`} />
														<Legend />
													</PieChart>
												</ResponsiveContainer>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle className="flex items-center">
												<TrendingUp className="mr-2 h-5 w-5" />
												Eficiência por Veículo
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="overflow-x-auto">
												<table className="w-full border-collapse">
													<thead>
														<tr className="border-b">
															<th className="text-left py-2">Veículo</th>
															<th className="text-left py-2">Distância</th>
															<th className="text-left py-2">Consumo</th>
															<th className="text-left py-2">Custo/km</th>
														</tr>
													</thead>
													<tbody>
														{vehicleSummary.map((vehicle: any) => (
															<tr key={vehicle.id} className="border-b">
																<td className="py-2">{vehicle.name}</td>
																<td className="py-2">{vehicle.distance.toFixed(1)} km</td>
																<td className="py-2">{vehicle.avgConsumption.toFixed(2)} km/L</td>
																<td className="py-2">{vehicle.costPerKm.toFixed(2)} €/km</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</CardContent>
									</Card>
								</div>
							)}

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<BarChart3 className="mr-2 h-5 w-5" />
										Registros de Abastecimento
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="overflow-x-auto">
										<table className="w-full border-collapse">
											<thead>
												<tr className="border-b">
													<th className="text-left py-2">Data</th>
													<th className="text-left py-2">Turno</th>
													<th className="text-left py-2">Veículo</th>
													<th className="text-left py-2">Quantidade</th>
													<th className="text-left py-2">Preço/L</th>
													<th className="text-left py-2">Total</th>
												</tr>
											</thead>
											<tbody>
												{shiftsWithFuel.flatMap((shift: any) =>
													shift.fuelRecords.map((record: any) => (
														<tr key={record.id} className="border-b">
															<td className="py-2">{format(new Date(record.date), "dd/MM/yyyy")}</td>
															<td className="py-2">{format(new Date(shift.date), "dd/MM/yyyy")}</td>
															<td className="py-2">
																{shift.vehicle ? `${shift.vehicle.make} ${shift.vehicle.model}` : "N/A"}
															</td>
															<td className="py-2">{record.fuelAmount.toFixed(2)} L</td>
															<td className="py-2">{record.pricePerUnit.toFixed(3)} €</td>
															<td className="py-2">{record.totalPrice.toFixed(2)} €</td>
														</tr>
													)),
												)}
											</tbody>
										</table>
									</div>
								</CardContent>
							</Card>
						</>
					) : (
						<div className="text-center p-8">
							<Fuel className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium mb-2">Nenhum registro de combustível</h3>
							<p className="text-muted-foreground">
								Não há registros de abastecimento associados aos turnos deste período semanal.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
