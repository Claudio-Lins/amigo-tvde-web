"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	eachDayOfInterval,
	eachMonthOfInterval,
	endOfMonth,
	format,
	parseISO,
	startOfMonth,
	subDays,
	subMonths,
	subYears,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, Calendar, Car, DollarSign, Download, Fuel, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export default function ReportsPage() {
	const [period, setPeriod] = useState("month");
	const [activeTab, setActiveTab] = useState("earnings");

	// Dados de exemplo para os gráficos
	const generateDailyData = () => {
		const today = new Date();
		const days = period === "week" ? 7 : period === "month" ? 30 : 90;

		return Array.from({ length: days }).map((_, i) => {
			const date = subDays(today, days - i - 1);
			const dateStr = format(date, "yyyy-MM-dd");
			const dayOfWeek = format(date, "EEE", { locale: ptBR });

			// Valores aleatórios para simular dados
			const distance = Math.floor(Math.random() * 100) + 50; // 50-150 km
			const fuelCost = Math.floor(Math.random() * 20) + 10; // 10-30 euros
			const uberEarnings = Math.floor(Math.random() * 60) + 40; // 40-100 euros
			const boltEarnings = Math.floor(Math.random() * 40) + 20; // 20-60 euros
			const totalEarnings = uberEarnings + boltEarnings;
			const netEarnings = totalEarnings - fuelCost;
			const costPerKm = fuelCost / distance;
			const fuelConsumption = Math.random() * 5 + 15; // 15-20 kWh/100km

			return {
				date: dateStr,
				dayOfWeek,
				distance,
				fuelCost,
				uberEarnings,
				boltEarnings,
				totalEarnings,
				netEarnings,
				costPerKm,
				fuelConsumption,
			};
		});
	};

	const generateMonthlyData = () => {
		const today = new Date();
		const months = 12;

		return Array.from({ length: months }).map((_, i) => {
			const date = subMonths(today, months - i - 1);
			const monthStr = format(date, "yyyy-MM");
			const monthName = format(date, "MMM", { locale: ptBR });

			// Valores aleatórios para simular dados mensais
			const distance = Math.floor(Math.random() * 1000) + 1000; // 1000-2000 km
			const fuelCost = Math.floor(Math.random() * 200) + 100; // 100-300 euros
			const uberEarnings = Math.floor(Math.random() * 600) + 400; // 400-1000 euros
			const boltEarnings = Math.floor(Math.random() * 400) + 200; // 200-600 euros
			const totalEarnings = uberEarnings + boltEarnings;
			const netEarnings = totalEarnings - fuelCost;
			const costPerKm = fuelCost / distance;
			const fuelConsumption = Math.random() * 5 + 15; // 15-20 kWh/100km

			return {
				date: monthStr,
				month: monthName,
				distance,
				fuelCost,
				uberEarnings,
				boltEarnings,
				totalEarnings,
				netEarnings,
				costPerKm,
				fuelConsumption,
			};
		});
	};

	// Selecionar dados com base no período
	const data = period === "year" ? generateMonthlyData() : generateDailyData();

	// Calcular totais e médias
	const totalDistance = data.reduce((sum, item) => sum + item.distance, 0);
	const totalFuelCost = data.reduce((sum, item) => sum + item.fuelCost, 0);
	const totalEarnings = data.reduce((sum, item) => sum + item.totalEarnings, 0);
	const totalNetEarnings = data.reduce((sum, item) => sum + item.netEarnings, 0);
	const avgCostPerKm = totalFuelCost / totalDistance;
	const avgFuelConsumption = data.reduce((sum, item) => sum + item.fuelConsumption, 0) / data.length;

	// Dados para o gráfico de pizza de fontes de ganhos
	const earningsSourceData = [
		{ id: "uber", name: "Uber", value: data.reduce((sum, item) => sum + item.uberEarnings, 0) },
		{ id: "bolt", name: "Bolt", value: data.reduce((sum, item) => sum + item.boltEarnings, 0) },
	];

	// Cores para o gráfico de pizza
	const COLORS = ["#0088FE", "#00C49F"];

	// Formatação de valores monetários
	function formatCurrency(value: number) {
		return new Intl.NumberFormat("pt-PT", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2,
		}).format(value);
	}

	// Formatação de valores de distância
	function formatDistance(value: number) {
		return `${value.toLocaleString("pt-PT")} km`;
	}

	// Formatação de valores de consumo
	function formatConsumption(value: number) {
		return `${value.toFixed(1)} kWh/100km`;
	}

	// Título do período selecionado
	const periodTitle = {
		week: "Últimos 7 dias",
		month: "Últimos 30 dias",
		quarter: "Últimos 90 dias",
		year: "Últimos 12 meses",
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold">Relatórios e Análises</h1>
				<div className="flex items-center gap-2">
					<Select value={period} onValueChange={setPeriod}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Selecione o período" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="week">Últimos 7 dias</SelectItem>
							<SelectItem value="month">Últimos 30 dias</SelectItem>
							<SelectItem value="quarter">Últimos 90 dias</SelectItem>
							<SelectItem value="year">Últimos 12 meses</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" size="icon">
						<Download className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Distância Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatDistance(totalDistance)}</div>
						<p className="text-xs text-muted-foreground mt-1">
							<Car className="inline h-3 w-3 mr-1" />
							{period === "year" ? "Média mensal" : "Média diária"}: {formatDistance(totalDistance / data.length)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Ganhos Brutos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
						<p className="text-xs text-muted-foreground mt-1">
							<DollarSign className="inline h-3 w-3 mr-1" />
							{period === "year" ? "Média mensal" : "Média diária"}: {formatCurrency(totalEarnings / data.length)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Ganhos Líquidos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(totalNetEarnings)}</div>
						<p className="text-xs text-muted-foreground mt-1">
							<TrendingUp className="inline h-3 w-3 mr-1" />
							{period === "year" ? "Média mensal" : "Média diária"}: {formatCurrency(totalNetEarnings / data.length)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Custo por km</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(avgCostPerKm)}/km</div>
						<p className="text-xs text-muted-foreground mt-1">
							<Fuel className="inline h-3 w-3 mr-1" />
							Consumo médio: {formatConsumption(avgFuelConsumption)}
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Análise Detalhada - {periodTitle[period as keyof typeof periodTitle]}</CardTitle>
					<CardDescription>Visualize seus dados de desempenho ao longo do tempo</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="mb-4">
							<TabsTrigger value="earnings">Ganhos</TabsTrigger>
							<TabsTrigger value="distance">Distância</TabsTrigger>
							<TabsTrigger value="costs">Custos</TabsTrigger>
							<TabsTrigger value="efficiency">Eficiência</TabsTrigger>
						</TabsList>

						<TabsContent value="earnings" className="space-y-4">
							<div className="h-[300px]">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey={period === "year" ? "month" : "dayOfWeek"} tick={{ fontSize: 12 }} />
										<YAxis tickFormatter={(value) => `€${value}`} tick={{ fontSize: 12 }} />
										<Tooltip
											formatter={(value) => {
												return typeof value === "number" ? [`€${value.toFixed(2)}`, ""] : [`€${value}`, ""];
											}}
											labelFormatter={(label) => `${label}`}
										/>
										<Legend />
										<Area
											type="monotone"
											dataKey="uberEarnings"
											name="Uber"
											stackId="1"
											stroke="#0088FE"
											fill="#0088FE"
										/>
										<Area
											type="monotone"
											dataKey="boltEarnings"
											name="Bolt"
											stackId="1"
											stroke="#00C49F"
											fill="#00C49F"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="h-[200px]">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={earningsSourceData}
												cx="50%"
												cy="50%"
												labelLine={false}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
												label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
											>
												{earningsSourceData.map((entry) => (
													<Cell
														key={entry.id}
														fill={COLORS[earningsSourceData.findIndex((e) => e.id === entry.id) % COLORS.length]}
													/>
												))}
											</Pie>
											<Tooltip formatter={(value) => formatCurrency(Number(value))} />
										</PieChart>
									</ResponsiveContainer>
								</div>

								<div className="h-[200px]">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={data}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey={period === "year" ? "month" : "dayOfWeek"} tick={{ fontSize: 12 }} />
											<YAxis tickFormatter={(value) => `€${value}`} tick={{ fontSize: 12 }} />
											<Tooltip
												formatter={(value) => {
													return typeof value === "number" ? [`€${value.toFixed(2)}`, ""] : [`€${value}`, ""];
												}}
												labelFormatter={(label) => `${label}`}
											/>
											<Legend />
											<Line
												type="monotone"
												dataKey="netEarnings"
												name="Ganho Líquido"
												stroke="#8884d8"
												activeDot={{ r: 8 }}
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="distance" className="h-[300px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey={period === "year" ? "month" : "dayOfWeek"} tick={{ fontSize: 12 }} />
									<YAxis tickFormatter={(value) => `${value} km`} tick={{ fontSize: 12 }} />
									<Tooltip formatter={(value) => [`${value} km`, "Distância"]} labelFormatter={(label) => `${label}`} />
									<Legend />
									<Bar dataKey="distance" name="Distância" fill="#8884d8" />
								</BarChart>
							</ResponsiveContainer>
						</TabsContent>

						<TabsContent value="costs" className="h-[300px]">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey={period === "year" ? "month" : "dayOfWeek"} tick={{ fontSize: 12 }} />
									<YAxis tickFormatter={(value) => `€${value}`} tick={{ fontSize: 12 }} />
									<Tooltip
										formatter={(value) => {
											return typeof value === "number" ? [`€${value.toFixed(2)}`, ""] : [`€${value}`, ""];
										}}
										labelFormatter={(label) => `${label}`}
									/>
									<Legend />
									<Line
										type="monotone"
										dataKey="fuelCost"
										name="Custo de Combustível"
										stroke="#ff7300"
										activeDot={{ r: 8 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</TabsContent>

						<TabsContent value="efficiency" className="h-[300px]">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey={period === "year" ? "month" : "dayOfWeek"} tick={{ fontSize: 12 }} />
									<YAxis yAxisId="left" tickFormatter={(value) => `€${value}`} tick={{ fontSize: 12 }} />
									<YAxis
										yAxisId="right"
										orientation="right"
										tickFormatter={(value) => `${value.toFixed(1)}`}
										tick={{ fontSize: 12 }}
									/>
									<Tooltip
										formatter={(value, name) => {
											if (name === "Custo por km")
												return typeof value === "number" ? [`€${value.toFixed(2)}/km`, name] : [`€${value}/km`, name];
											if (name === "Consumo")
												return typeof value === "number"
													? [`${value.toFixed(1)} kWh/100km`, name]
													: [`${value} kWh/100km`, name];
											return [value, name];
										}}
										labelFormatter={(label) => `${label}`}
									/>
									<Legend />
									<Line
										yAxisId="left"
										type="monotone"
										dataKey="costPerKm"
										name="Custo por km"
										stroke="#82ca9d"
										activeDot={{ r: 8 }}
									/>
									<Line
										yAxisId="right"
										type="monotone"
										dataKey="fuelConsumption"
										name="Consumo"
										stroke="#ffc658"
										activeDot={{ r: 8 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</TabsContent>
					</Tabs>
				</CardContent>
				<CardFooter className="text-sm text-muted-foreground">
					<BarChart3 className="mr-2 h-4 w-4" />
					Os dados são baseados nas entradas registradas no período selecionado.
				</CardFooter>
			</Card>
		</div>
	);
}
