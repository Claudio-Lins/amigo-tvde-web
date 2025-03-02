"use client";

import { getWeeklyPeriods } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isAfter, isBefore, isWithinInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Calendar, DollarSign, LineChart, Plus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

export default function DashboardPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [weeklyPeriods, setWeeklyPeriods] = useState<any[]>([]);
	const [stats, setStats] = useState({
		totalEarnings: 0,
		totalExpenses: 0,
		netEarnings: 0,
		totalShifts: 0,
		totalWeeklyPeriods: 0,
		averageWeeklyEarnings: 0,
		currentWeekEarnings: 0,
		previousWeekEarnings: 0,
		weeklyTrend: 0,
	});

	useEffect(() => {
		async function loadData() {
			try {
				const result = await getWeeklyPeriods();

				if (result && !("error" in result)) {
					setWeeklyPeriods(result);
					calculateStats(result);
				} else {
					toast.error(result?.error || "Erro ao carregar períodos semanais");
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados do dashboard");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, []);

	function calculateStats(periods: any[]) {
		// Ordenar períodos por data (mais recente primeiro)
		const sortedPeriods = [...periods].sort((a, b) => {
			return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
		});

		// Usar os dois períodos mais recentes em vez de tentar encontrar o "atual" e o "anterior"
		const mostRecentPeriod = sortedPeriods[0] || null;
		const secondMostRecentPeriod = sortedPeriods[1] || null;

		// Calcular estatísticas gerais
		const totalEarnings = periods.reduce((sum, period) => {
			const periodEarnings = (period.Shift || []).reduce(
				(shiftSum: number, shift: any) =>
					shiftSum + shift.uberEarnings + shift.boltEarnings + (shift.otherEarnings || 0),
				0,
			);
			return sum + periodEarnings;
		}, 0);

		const totalExpenses = periods.reduce((sum, period) => {
			const periodExpenses = (period.Expense || []).reduce(
				(expenseSum: number, expense: any) => expenseSum + expense.amount,
				0,
			);
			return sum + periodExpenses;
		}, 0);

		const netEarnings = totalEarnings - totalExpenses;

		const totalShifts = periods.reduce((sum, period) => sum + (period.Shift?.length || 0), 0);

		// Calcular média semanal
		const averageWeeklyEarnings = periods.length > 0 ? netEarnings / periods.length : 0;

		// Calcular ganhos da semana atual e anterior
		const currentWeekEarnings = calculatePeriodNetEarnings(mostRecentPeriod);
		const previousWeekEarnings = calculatePeriodNetEarnings(secondMostRecentPeriod);

		// Calcular tendência semanal (% de mudança)
		let weeklyTrend = 0;

		if (previousWeekEarnings > 0) {
			weeklyTrend = ((currentWeekEarnings - previousWeekEarnings) / previousWeekEarnings) * 100;
		} else if (previousWeekEarnings === 0 && currentWeekEarnings > 0) {
			weeklyTrend = 100; // Aumento de 100% quando passamos de 0 para algum valor positivo
		} else if (previousWeekEarnings === 0 && currentWeekEarnings === 0) {
			weeklyTrend = 0; // Sem mudança quando ambos são zero
		}

		// Limitar valores extremos para melhor visualização
		if (weeklyTrend < -100) weeklyTrend = -100;
		if (weeklyTrend > 1000) weeklyTrend = 1000;

		setStats({
			totalEarnings,
			totalExpenses,
			netEarnings,
			totalShifts,
			totalWeeklyPeriods: periods.length,
			averageWeeklyEarnings,
			currentWeekEarnings,
			previousWeekEarnings,
			weeklyTrend,
		});
	}

	function calculatePeriodNetEarnings(period: any) {
		if (!period) return 0;

		const periodEarnings = (period.Shift || []).reduce(
			(sum: number, shift: any) => sum + shift.uberEarnings + shift.boltEarnings + (shift.otherEarnings || 0),
			0,
		);

		const periodExpenses = (period.Expense || []).reduce((sum: number, expense: any) => sum + expense.amount, 0);

		return periodEarnings - periodExpenses;
	}

	// Preparar dados para o gráfico de tendência semanal
	const weeklyTrendData = weeklyPeriods
		.map((period) => {
			const netEarnings = calculatePeriodNetEarnings(period);
			return {
				name: format(new Date(period.startDate), "dd/MM", { locale: ptBR }),
				earnings: netEarnings,
			};
		})
		.sort((a, b) => {
			const dateA = new Date(a.name.split("/").reverse().join("/"));
			const dateB = new Date(b.name.split("/").reverse().join("/"));
			return dateA.getTime() - dateB.getTime();
		})
		.slice(-8); // Mostrar apenas as últimas 8 semanas

	// Preparar dados para o gráfico de distribuição de ganhos vs despesas
	const lastThreeMonthsPeriods = weeklyPeriods.filter((period) =>
		isAfter(new Date(period.endDate), subMonths(new Date(), 3)),
	);

	const earningsVsExpensesData = lastThreeMonthsPeriods
		.map((period) => {
			const earnings = (period.Shift || []).reduce(
				(sum: number, shift: any) => sum + shift.uberEarnings + shift.boltEarnings + (shift.otherEarnings || 0),
				0,
			);

			const expenses = (period.Expense || []).reduce((sum: number, expense: any) => sum + expense.amount, 0);

			return {
				name: format(new Date(period.startDate), "dd/MM", { locale: ptBR }),
				ganhos: earnings,
				despesas: expenses,
				liquido: earnings - expenses,
			};
		})
		.sort((a, b) => {
			const dateA = new Date(a.name.split("/").reverse().join("/"));
			const dateB = new Date(b.name.split("/").reverse().join("/"));
			return dateA.getTime() - dateB.getTime();
		});

	// Formatar valores monetários
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
	}

	if (isLoading) {
		return (
			<div className="container py-6 md:py-0 space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Dashboard</h1>
					<Skeleton className="h-10 w-40" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<Skeleton key={i} className="h-32" />
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Skeleton className="h-80" />
					<Skeleton className="h-80" />
				</div>
			</div>
		);
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<Button asChild>
					<Link href="/dashboard/weekly-periods/new">
						<Plus className="mr-2 h-4 w-4" />
						Novo Período
					</Link>
				</Button>
			</div>

			{/* Cards de estatísticas */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<DollarSign className="h-4 w-4 mr-2 text-primary" />
							Ganhos Líquidos Totais
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(stats.netEarnings)}</div>
						<p className="text-xs text-muted-foreground">
							{stats.totalWeeklyPeriods > 0
								? `Em ${stats.totalWeeklyPeriods} períodos semanais`
								: "Nenhum período registrado"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<Calendar className="h-4 w-4 mr-2 text-primary" />
							Média Semanal
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(stats.averageWeeklyEarnings)}</div>
						<p className="text-xs text-muted-foreground">Ganhos líquidos por semana</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<LineChart className="h-4 w-4 mr-2 text-primary" />
							Tendência Semanal
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center">
							<div className="text-2xl font-bold">
								{stats.weeklyTrend === 0 && stats.previousWeekEarnings === 0 ? (
									"N/A"
								) : (
									<>
										{stats.weeklyTrend > 0 ? "+" : ""}
										{stats.weeklyTrend.toFixed(1)}%
									</>
								)}
							</div>
							{stats.weeklyTrend > 0 ? (
								<TrendingUp className="ml-2 h-4 w-4 text-green-500" />
							) : stats.weeklyTrend < 0 ? (
								<TrendingDown className="ml-2 h-4 w-4 text-red-500" />
							) : null}
						</div>
						<p className="text-xs text-muted-foreground">
							{stats.previousWeekEarnings > 0 || stats.currentWeekEarnings > 0 ? (
								<>
									{formatCurrency(stats.currentWeekEarnings)} vs {formatCurrency(stats.previousWeekEarnings)}
								</>
							) : (
								"Dados insuficientes para comparação"
							)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<DollarSign className="h-4 w-4 mr-2 text-primary" />
							Despesas Totais
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
						<p className="text-xs text-muted-foreground">
							{stats.totalEarnings > 0
								? `${((stats.totalExpenses / stats.totalEarnings) * 100).toFixed(0)}% dos ganhos brutos`
								: "0% dos ganhos brutos"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Gráficos */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Tendência de Ganhos Semanais</CardTitle>
						<CardDescription>Evolução dos ganhos líquidos nas últimas semanas</CardDescription>
					</CardHeader>
					<CardContent>
						{weeklyTrendData.length > 0 ? (
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={weeklyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis />
										<Tooltip formatter={(value) => formatCurrency(value as number)} />
										<Area
											type="monotone"
											dataKey="earnings"
											name="Ganhos Líquidos"
											stroke="#8884d8"
											fill="#8884d8"
											fillOpacity={0.3}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<p className="text-muted-foreground">Nenhum dado disponível para exibir o gráfico.</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ganhos vs Despesas</CardTitle>
						<CardDescription>Comparativo dos últimos 3 meses</CardDescription>
					</CardHeader>
					<CardContent>
						{earningsVsExpensesData.length > 0 ? (
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={earningsVsExpensesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis />
										<Tooltip formatter={(value) => formatCurrency(value as number)} />
										<Legend />
										<Bar dataKey="ganhos" name="Ganhos" fill="#4CAF50" />
										<Bar dataKey="despesas" name="Despesas" fill="#F44336" />
										<Bar dataKey="liquido" name="Líquido" fill="#2196F3" />
									</BarChart>
								</ResponsiveContainer>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<p className="text-muted-foreground">Nenhum dado disponível para exibir o gráfico.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Períodos recentes */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Períodos Semanais Recentes</CardTitle>
						<CardDescription>Seus períodos semanais mais recentes</CardDescription>
					</div>
					<Button variant="outline" size="sm" asChild>
						<Link href="/dashboard/weekly-periods">
							Ver Todos
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</CardHeader>
				<CardContent>
					{weeklyPeriods.length > 0 ? (
						<div className="space-y-4">
							{weeklyPeriods
								.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
								.slice(0, 3)
								.map((period) => {
									const netEarnings = calculatePeriodNetEarnings(period);
									return (
										<Link href={`/dashboard/weekly-periods/${period.id}`} key={period.id} className="block">
											<div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
												<div>
													<h3 className="font-medium">{period.name || "Período Semanal"}</h3>
													<p className="text-sm text-muted-foreground">
														{format(new Date(period.startDate), "dd/MM/yyyy", {
															locale: ptBR,
														})}{" "}
														a{" "}
														{format(new Date(period.endDate), "dd/MM/yyyy", {
															locale: ptBR,
														})}
													</p>
												</div>
												<div className="text-right">
													<p className={`font-medium ${netEarnings >= 0 ? "text-green-600" : "text-red-600"}`}>
														{formatCurrency(netEarnings)}
													</p>
													<p className="text-xs text-muted-foreground">{period.Shift?.length || 0} turnos</p>
												</div>
											</div>
										</Link>
									);
								})}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<p className="text-muted-foreground mb-4">Você ainda não tem períodos semanais registrados.</p>
							<Button asChild>
								<Link href="/dashboard/weekly-periods/new">
									<Plus className="mr-2 h-4 w-4" />
									Criar Primeiro Período
								</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
