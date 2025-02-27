"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { eachDayOfInterval, endOfWeek, format, parseISO, startOfWeek, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	Calendar,
	Car,
	Clock,
	DollarSign,
	Fuel,
	Plus,
	TrendingUp,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function DashboardPage() {
	const [period, setPeriod] = useState("week");
	const [isLoading, setIsLoading] = useState(true);
	const [dashboardData, setDashboardData] = useState<any>(null);

	useEffect(() => {
		// Simular carregamento de dados
		setIsLoading(true);

		setTimeout(() => {
			// Gerar dados de exemplo
			const today = new Date();
			const startDate = startOfWeek(today, { weekStartsOn: 1 });
			const endDate = endOfWeek(today, { weekStartsOn: 1 });

			const dailyEntries = eachDayOfInterval({ start: startDate, end: endDate }).map((date) => {
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
					id: `entry-${dateStr}`,
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

			// Calcular totais e médias
			const totalDistance = dailyEntries.reduce((sum, entry) => sum + entry.distance, 0);
			const totalFuelCost = dailyEntries.reduce((sum, entry) => sum + entry.fuelCost, 0);
			const totalEarnings = dailyEntries.reduce((sum, entry) => sum + entry.totalEarnings, 0);
			const totalNetEarnings = dailyEntries.reduce((sum, entry) => sum + entry.netEarnings, 0);
			const avgCostPerKm = totalFuelCost / totalDistance;
			const avgFuelConsumption =
				dailyEntries.reduce((sum, entry) => sum + entry.fuelConsumption, 0) / dailyEntries.length;

			// Dados de comparação com a semana anterior
			const prevWeekDistance = totalDistance * 0.9; // Simular 10% menos na semana anterior
			const prevWeekEarnings = totalEarnings * 0.85; // Simular 15% menos na semana anterior
			const prevWeekCosts = totalFuelCost * 0.95; // Simular 5% menos na semana anterior

			// Calcular variações percentuais
			const distanceChange = ((totalDistance - prevWeekDistance) / prevWeekDistance) * 100;
			const earningsChange = ((totalEarnings - prevWeekEarnings) / prevWeekEarnings) * 100;
			const costsChange = ((totalFuelCost - prevWeekCosts) / prevWeekCosts) * 100;

			// Dados para o gráfico de pizza de fontes de ganhos
			const earningsSourceData = [
				{ id: "uber", name: "Uber", value: dailyEntries.reduce((sum, entry) => sum + entry.uberEarnings, 0) },
				{ id: "bolt", name: "Bolt", value: dailyEntries.reduce((sum, entry) => sum + entry.boltEarnings, 0) },
			];

			// Dados para o gráfico de barras de distância por dia
			const distanceData = dailyEntries.map((entry) => ({
				day: entry.dayOfWeek,
				distance: entry.distance,
			}));

			// Dados para o gráfico de linha de ganhos por dia
			const earningsData = dailyEntries.map((entry) => ({
				day: entry.dayOfWeek,
				earnings: entry.totalEarnings,
				costs: entry.fuelCost,
				net: entry.netEarnings,
			}));

			// Dados para o gráfico de eficiência
			const efficiencyData = dailyEntries.map((entry) => ({
				day: entry.dayOfWeek,
				costPerKm: entry.costPerKm,
				consumption: entry.fuelConsumption,
			}));

			// Últimas entradas
			const recentEntries = [...dailyEntries]
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
				.slice(0, 5);

			// Definir os dados do dashboard
			setDashboardData({
				dailyEntries,
				recentEntries,
				totals: {
					distance: totalDistance,
					fuelCost: totalFuelCost,
					earnings: totalEarnings,
					netEarnings: totalNetEarnings,
				},
				averages: {
					costPerKm: avgCostPerKm,
					fuelConsumption: avgFuelConsumption,
				},
				changes: {
					distance: distanceChange,
					earnings: earningsChange,
					costs: costsChange,
				},
				charts: {
					earningsSource: earningsSourceData,
					distance: distanceData,
					earnings: earningsData,
					efficiency: efficiencyData,
				},
			});

			setIsLoading(false);
		}, 1000);
	}, []);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-200px)]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
					<p className="mt-4 text-muted-foreground">Carregando dados do dashboard...</p>
				</div>
			</div>
		);
	}

	// Cores para os gráficos
	const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">Bem-vindo de volta! Aqui está um resumo da sua atividade recente.</p>
				</div>
				<div className="flex items-center gap-2">
					<Tabs defaultValue="week" className="w-[300px]" onValueChange={setPeriod}>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="week">Semana</TabsTrigger>
							<TabsTrigger value="month">Mês</TabsTrigger>
							<TabsTrigger value="year">Ano</TabsTrigger>
						</TabsList>
					</Tabs>
					<Link href="/dashboard/daily-entries/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Nova Entrada
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">€{dashboardData.totals.earnings.toFixed(2)}</div>
						<div className="flex items-center space-x-2">
							<p className={`text-xs ${dashboardData.changes.earnings >= 0 ? "text-green-500" : "text-red-500"}`}>
								{dashboardData.changes.earnings >= 0 ? (
									<ArrowUpRight className="inline h-3 w-3 mr-1" />
								) : (
									<ArrowDownRight className="inline h-3 w-3 mr-1" />
								)}
								{Math.abs(dashboardData.changes.earnings).toFixed(1)}%
							</p>
							<p className="text-xs text-muted-foreground">vs. período anterior</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Ganhos Líquidos</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">€{dashboardData.totals.netEarnings.toFixed(2)}</div>
						<div className="text-xs text-muted-foreground">
							{((dashboardData.totals.netEarnings / dashboardData.totals.earnings) * 100).toFixed(1)}% dos ganhos totais
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Distância Total</CardTitle>
						<Car className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{dashboardData.totals.distance.toFixed(0)} km</div>
						<div className="flex items-center space-x-2">
							<p className={`text-xs ${dashboardData.changes.distance >= 0 ? "text-green-500" : "text-red-500"}`}>
								{dashboardData.changes.distance >= 0 ? (
									<ArrowUpRight className="inline h-3 w-3 mr-1" />
								) : (
									<ArrowDownRight className="inline h-3 w-3 mr-1" />
								)}
								{Math.abs(dashboardData.changes.distance).toFixed(1)}%
							</p>
							<p className="text-xs text-muted-foreground">vs. período anterior</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Custo por km</CardTitle>
						<Fuel className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">€{dashboardData.averages.costPerKm.toFixed(2)}/km</div>
						<div className="text-xs text-muted-foreground">
							Consumo médio: {dashboardData.averages.fuelConsumption.toFixed(1)} kWh/100km
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="md:col-span-4">
					<CardHeader>
						<CardTitle>Ganhos por Dia</CardTitle>
						<CardDescription>Visualização dos seus ganhos diários no período selecionado</CardDescription>
					</CardHeader>
					<CardContent className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={dashboardData.charts.earnings}>
								<defs>
									<linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
										<stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
										<stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="day" />
								<YAxis tickFormatter={(value) => `€${value}`} />
								<Tooltip
									formatter={(value) => {
										return typeof value === "number" ? [`€${value.toFixed(2)}`, ""] : [`€${value}`, ""];
									}}
								/>
								<Legend />
								<Area
									type="monotone"
									dataKey="earnings"
									name="Ganhos Brutos"
									stroke="#8884d8"
									fillOpacity={1}
									fill="url(#colorEarnings)"
								/>
								<Area
									type="monotone"
									dataKey="net"
									name="Ganhos Líquidos"
									stroke="#82ca9d"
									fillOpacity={1}
									fill="url(#colorNet)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card className="md:col-span-3">
					<CardHeader>
						<CardTitle>Distribuição de Ganhos</CardTitle>
						<CardDescription>Distribuição dos seus ganhos por plataforma</CardDescription>
					</CardHeader>
					<CardContent className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={dashboardData.charts.earningsSource}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{dashboardData.charts.earningsSource.map((entry: any) => (
										<Cell
											key={entry.id}
											fill={
												COLORS[
													dashboardData.charts.earningsSource.findIndex((e: any) => e.id === entry.id) % COLORS.length
												]
											}
										/>
									))}
								</Pie>
								<Tooltip
									formatter={(value) => {
										return typeof value === "number" ? [`€${value.toFixed(2)}`, ""] : [`€${value}`, ""];
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="md:col-span-4">
					<CardHeader>
						<CardTitle>Entradas Recentes</CardTitle>
						<CardDescription>Suas últimas 5 entradas de dados</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{dashboardData.recentEntries.map((entry: any) => (
								<div key={entry.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
									<div className="flex items-center space-x-4">
										<div className="rounded-full bg-primary/10 p-2">
											<Calendar className="h-4 w-4 text-primary" />
										</div>
										<div>
											<p className="text-sm font-medium">{format(parseISO(entry.date), "dd/MM/yyyy")}</p>
											<p className="text-xs text-muted-foreground">
												{entry.distance} km | €{entry.totalEarnings.toFixed(2)}
											</p>
										</div>
									</div>
									<Link href={`/dashboard/daily-entries/${entry.id}`}>
										<Button variant="ghost" size="icon">
											<ArrowRight className="h-4 w-4" />
										</Button>
									</Link>
								</div>
							))}
						</div>
					</CardContent>
					<CardFooter>
						<Link href="/dashboard/daily-entries" className="w-full">
							<Button variant="outline" className="w-full">
								Ver Todas as Entradas
							</Button>
						</Link>
					</CardFooter>
				</Card>

				<Card className="md:col-span-3">
					<CardHeader>
						<CardTitle>Eficiência</CardTitle>
						<CardDescription>Custo por km e consumo de energia</CardDescription>
					</CardHeader>
					<CardContent className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={dashboardData.charts.efficiency}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="day" />
								<YAxis yAxisId="left" tickFormatter={(value) => `€${value}`} />
								<YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
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
								/>
								<Legend />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="costPerKm"
									name="Custo por km"
									stroke="#8884d8"
									activeDot={{ r: 8 }}
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="consumption"
									name="Consumo"
									stroke="#82ca9d"
									activeDot={{ r: 8 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
