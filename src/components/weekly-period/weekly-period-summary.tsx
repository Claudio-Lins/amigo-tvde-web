"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense, Shift, WeeklyPeriod } from "@prisma/client";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Car, Clock, DollarSign, Fuel, TrendingUp } from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

// Estender a interface Shift para incluir otherEarnings
interface ExtendedShift extends Shift {
	otherEarnings?: number;
}

// Atualizar a interface WeeklyPeriodWithRelations
interface WeeklyPeriodWithRelations extends WeeklyPeriod {
	Shift?: ExtendedShift[];
	Expense?: Expense[];
}

interface WeeklyPeriodSummaryProps {
	weeklyPeriod: any; // Usar tipagem mais genérica
}

export function WeeklyPeriodSummary({ weeklyPeriod }: WeeklyPeriodSummaryProps) {
	// Calcular estatísticas
	const shifts = weeklyPeriod.Shift || [];
	const expenses = weeklyPeriod.Expense || [];

	const totalDays = differenceInDays(new Date(weeklyPeriod.endDate), new Date(weeklyPeriod.startDate)) + 1;
	const daysWithShifts = new Set(shifts.map((shift) => format(new Date(shift.date), "yyyy-MM-dd"))).size;

	const totalEarnings = shifts.reduce(
		(sum, shift) => sum + shift.uberEarnings + shift.boltEarnings + (shift.otherEarnings || 0),
		0,
	);

	const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
	const netEarnings = totalEarnings - totalExpenses;

	const uberEarnings = shifts.reduce((sum, shift) => sum + shift.uberEarnings, 0);
	const boltEarnings = shifts.reduce((sum, shift) => sum + shift.boltEarnings, 0);
	const otherEarnings = shifts.reduce((sum, shift) => sum + (shift.otherEarnings || 0), 0);

	// Dados para o gráfico de ganhos diários
	const dailyEarningsData = shifts.reduce(
		(acc, shift) => {
			const dateStr = format(new Date(shift.date), "dd/MM", { locale: ptBR });
			const existingDay = acc.find((item) => item.date === dateStr);

			if (existingDay) {
				existingDay.uber += shift.uberEarnings;
				existingDay.bolt += shift.boltEarnings;
				existingDay.other += shift.otherEarnings || 0;
				existingDay.total += shift.uberEarnings + shift.boltEarnings + (shift.otherEarnings || 0);
			} else {
				acc.push({
					date: dateStr,
					uber: shift.uberEarnings,
					bolt: shift.boltEarnings,
					other: shift.otherEarnings || 0,
					total: shift.uberEarnings + shift.boltEarnings + (shift.otherEarnings || 0),
				});
			}

			return acc;
		},
		[] as Array<{ date: string; uber: number; bolt: number; other: number; total: number }>,
	);

	// Ordenar por data
	dailyEarningsData.sort((a, b) => {
		const dateA = new Date(a.date.split("/").reverse().join("/"));
		const dateB = new Date(b.date.split("/").reverse().join("/"));
		return dateA.getTime() - dateB.getTime();
	});

	// Dados para o gráfico de despesas por categoria
	const expensesByCategory = expenses.reduce(
		(acc, expense) => {
			const category = expense.category;
			const existingCategory = acc.find((item) => item.name === category);

			if (existingCategory) {
				existingCategory.value += expense.amount;
			} else {
				acc.push({
					name: category,
					value: expense.amount,
				});
			}

			return acc;
		},
		[] as Array<{ name: string; value: number }>,
	);

	// Cores para o gráfico de pizza
	const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B"];

	// Função para traduzir categorias de despesa
	function translateExpenseCategory(category: string): string {
		const translations: Record<string, string> = {
			FUEL: "Combustível",
			FOOD: "Alimentação",
			MAINTENANCE: "Manutenção",
			PARKING: "Estacionamento",
			TOLL: "Pedágio",
			OTHER: "Outros",
		};

		return translations[category] || category;
	}

	// Formatar valores monetários
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
	}

	return (
		<div className="space-y-6">
			{/* Estatísticas gerais */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<Calendar className="h-4 w-4 mr-2 text-primary" />
							Período
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{daysWithShifts} de {totalDays} dias
						</div>
						<p className="text-xs text-muted-foreground">
							{Math.round((daysWithShifts / totalDays) * 100)}% dos dias com atividade
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<DollarSign className="h-4 w-4 mr-2 text-primary" />
							Ganho Médio Diário
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{daysWithShifts > 0 ? formatCurrency(totalEarnings / daysWithShifts) : "€ 0,00"}
						</div>
						<p className="text-xs text-muted-foreground">
							Líquido: {daysWithShifts > 0 ? formatCurrency(netEarnings / daysWithShifts) : "€ 0,00"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<TrendingUp className="h-4 w-4 mr-2 text-primary" />
							Meta Semanal
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{weeklyPeriod.weeklyGoal ? formatCurrency(weeklyPeriod.weeklyGoal) : "Não definida"}
						</div>
						{weeklyPeriod.weeklyGoal ? (
							<p className="text-xs text-muted-foreground">
								{Math.round((netEarnings / weeklyPeriod.weeklyGoal) * 100)}% da meta atingida
							</p>
						) : (
							<p className="text-xs text-muted-foreground">Defina uma meta para acompanhar</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Gráfico de ganhos diários */}
			<Card>
				<CardHeader>
					<CardTitle>Ganhos Diários</CardTitle>
					<CardDescription>Distribuição dos ganhos por dia e plataforma</CardDescription>
				</CardHeader>
				<CardContent>
					{dailyEarningsData.length > 0 ? (
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={dailyEarningsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip formatter={(value) => formatCurrency(value as number)} />
									<Legend />
									<Bar dataKey="uber" name="Uber" fill="#276EF1" />
									<Bar dataKey="bolt" name="Bolt" fill="#34C759" />
									{otherEarnings > 0 && <Bar dataKey="other" name="Outros" fill="#FF9500" />}
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

			{/* Gráfico de despesas por categoria */}
			<Card>
				<CardHeader>
					<CardTitle>Despesas por Categoria</CardTitle>
					<CardDescription>Distribuição das despesas por categoria</CardDescription>
				</CardHeader>
				<CardContent>
					{expensesByCategory.length > 0 ? (
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={expensesByCategory}
										cx="50%"
										cy="50%"
										labelLine={true}
										label={({ name, percent }) =>
											`${translateExpenseCategory(name as string)} (${(percent * 100).toFixed(0)}%)`
										}
										outerRadius={80}
										fill="#8884d8"
										dataKey="value"
									>
										{expensesByCategory.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip formatter={(value) => formatCurrency(value as number)} />
									<Legend formatter={(value) => translateExpenseCategory(value)} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<p className="text-muted-foreground">Nenhuma despesa registrada para exibir o gráfico.</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Resumo financeiro */}
			<Card>
				<CardHeader>
					<CardTitle>Resumo Financeiro</CardTitle>
					<CardDescription>Visão geral das finanças do período</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Ganhos Brutos</h3>
								<p className="text-xl font-bold">{formatCurrency(totalEarnings)}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Despesas</h3>
								<p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
							</div>
						</div>

						<div className="pt-4 border-t">
							<h3 className="text-sm font-medium text-muted-foreground">Ganhos por Plataforma</h3>
							<div className="grid grid-cols-3 gap-4 mt-2">
								<div>
									<p className="text-sm text-muted-foreground">Uber</p>
									<p className="font-medium">{formatCurrency(uberEarnings)}</p>
									<p className="text-xs text-muted-foreground">
										{totalEarnings > 0 ? `${Math.round((uberEarnings / totalEarnings) * 100)}%` : "0%"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Bolt</p>
									<p className="font-medium">{formatCurrency(boltEarnings)}</p>
									<p className="text-xs text-muted-foreground">
										{totalEarnings > 0 ? `${Math.round((boltEarnings / totalEarnings) * 100)}%` : "0%"}
									</p>
								</div>
								{otherEarnings > 0 && (
									<div>
										<p className="text-sm text-muted-foreground">Outros</p>
										<p className="font-medium">{formatCurrency(otherEarnings)}</p>
										<p className="text-xs text-muted-foreground">
											{totalEarnings > 0 ? `${Math.round((otherEarnings / totalEarnings) * 100)}%` : "0%"}
										</p>
									</div>
								)}
							</div>
						</div>

						<div className="pt-4 border-t">
							<h3 className="text-sm font-medium text-muted-foreground">Resultado Final</h3>
							<p className={`text-2xl font-bold ${netEarnings >= 0 ? "text-green-600" : "text-red-600"}`}>
								{formatCurrency(netEarnings)}
							</p>
							<p className="text-xs text-muted-foreground">
								{totalEarnings > 0
									? `${Math.round((netEarnings / totalEarnings) * 100)}% dos ganhos brutos`
									: "0% dos ganhos brutos"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
