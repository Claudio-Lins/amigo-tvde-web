"use client";

import { deleteExpense } from "@/actions/expense-actions";
import { deleteShift } from "@/actions/shift-actions";
import { getWeeklyPeriodById, toggleWeeklyPeriodActive } from "@/actions/weekly-period-actions";
import { ExpenseList } from "@/components/expense/expense-list";
import { ShiftList } from "@/components/shift/shift-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyPeriodSummary } from "@/components/weekly-period/weekly-period-summary";
import { Expense, Shift, WeeklyPeriod } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, Check, Clock, DollarSign, Edit, Fuel, Power } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Estender a interface Shift para incluir otherEarnings
interface ExtendedShift extends Shift {
	otherEarnings: number | null;
}

// Atualizar a interface WeeklyPeriodWithRelations
interface WeeklyPeriodWithRelations extends WeeklyPeriod {
	Shift?: ExtendedShift[];
	Expense?: Expense[];
}

export default function WeeklyPeriodDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const [weeklyPeriod, setWeeklyPeriod] = useState<WeeklyPeriodWithRelations | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		async function loadWeeklyPeriod() {
			try {
				if (!params.id) return;

				const result = await getWeeklyPeriodById(params.id as string);

				if (result && !("error" in result)) {
					setWeeklyPeriod(result);
				} else {
					toast.error(result?.error || "Erro ao carregar período semanal");
					router.push("/dashboard/weekly-periods");
				}
			} catch (error) {
				console.error("Erro ao carregar período semanal:", error);
				toast.error("Erro ao carregar período semanal");
				router.push("/dashboard/weekly-periods");
			} finally {
				setIsLoading(false);
			}
		}

		loadWeeklyPeriod();
	}, [params.id, router]);

	async function handleToggleActive() {
		if (!weeklyPeriod) return;

		try {
			setIsProcessing(true);
			const result = await toggleWeeklyPeriodActive(weeklyPeriod.id);

			if (result && "success" in result) {
				setWeeklyPeriod((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
				toast.success(`Período ${result.weeklyPeriod?.isActive ? "ativado" : "desativado"} com sucesso`);
			} else {
				toast.error(result?.error || "Erro ao alterar status do período");
			}
		} catch (error) {
			console.error("Erro ao alterar status do período:", error);
			toast.error("Erro ao alterar status do período");
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleDeleteShift(shiftId: string) {
		try {
			const result = await deleteShift(shiftId);

			if (result && "success" in result) {
				toast.success("Turno excluído com sucesso");

				// Atualizar o estado local removendo o turno excluído
				setWeeklyPeriod((prev) => {
					if (!prev) return null;

					return {
						...prev,
						Shift: prev.Shift?.filter((shift) => shift.id !== shiftId) || [],
					};
				});
			} else {
				toast.error(result?.error || "Erro ao excluir turno");
			}
		} catch (error) {
			console.error("Erro ao excluir turno:", error);
			toast.error("Erro ao excluir turno");
		}
	}

	async function handleDeleteExpense(expenseId: string) {
		try {
			const result = await deleteExpense(expenseId);

			if (result && "success" in result) {
				toast.success("Despesa excluída com sucesso");

				// Atualizar o estado local removendo a despesa excluída
				setWeeklyPeriod((prev) => {
					if (!prev) return null;

					return {
						...prev,
						Expense: prev.Expense?.filter((expense) => expense.id !== expenseId) || [],
					};
				});
			} else {
				toast.error(result?.error || "Erro ao excluir despesa");
			}
		} catch (error) {
			console.error("Erro ao excluir despesa:", error);
			toast.error("Erro ao excluir despesa");
		}
	}

	if (isLoading) {
		return (
			<div className="container py-6 space-y-6">
				<div className="flex items-center">
					<Button variant="ghost" size="icon" asChild className="mr-2">
						<Link href="/dashboard/weekly-periods">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<Skeleton className="h-9 w-64" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>

				<Skeleton className="h-96" />
			</div>
		);
	}

	if (!weeklyPeriod) {
		return (
			<div className="container py-6">
				<div className="flex items-center mb-6">
					<Button variant="ghost" size="icon" asChild className="mr-2">
						<Link href="/dashboard/weekly-periods">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<h1 className="text-3xl font-bold">Período não encontrado</h1>
				</div>

				<p className="text-muted-foreground">
					O período semanal solicitado não foi encontrado. Verifique se o ID está correto ou retorne para a lista de
					períodos.
				</p>
			</div>
		);
	}

	// Atualizar a função para calcular estatísticas com base nos turnos
	const stats = {
		totalShifts: weeklyPeriod.Shift?.length || 0,
		totalEarnings:
			weeklyPeriod.Shift?.reduce((sum, shift) => sum + (shift.uberEarnings || 0) + (shift.boltEarnings || 0), 0) || 0,
		totalExpenses: weeklyPeriod.Expense?.reduce((sum, expense) => sum + expense.amount, 0) || 0,
		netEarnings:
			(weeklyPeriod.Shift?.reduce((sum, shift) => sum + (shift.uberEarnings || 0) + (shift.boltEarnings || 0), 0) ||
				0) - (weeklyPeriod.Expense?.reduce((sum, expense) => sum + expense.amount, 0) || 0),
		totalDistance: weeklyPeriod.Shift?.reduce((sum, shift) => sum + (shift.odometer || 0), 0) || 0,
		averageEarningsPerKm: 0,
	};

	// Calcular ganhos médios por km se houver distância percorrida
	if (stats.totalDistance > 0) {
		stats.averageEarningsPerKm = stats.totalEarnings / stats.totalDistance;
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center">
					<Button variant="ghost" size="icon" asChild className="mr-2">
						<Link href="/dashboard/weekly-periods">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<div>
						<h1 className="text-3xl font-bold flex items-center">
							{weeklyPeriod.name}
							{weeklyPeriod.isActive && (
								<span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
									<Check className="h-3 w-3 mr-1" />
									Ativo
								</span>
							)}
						</h1>
						<p className="text-muted-foreground">
							{format(new Date(weeklyPeriod.startDate), "dd 'de' MMMM", { locale: ptBR })} a{" "}
							{format(new Date(weeklyPeriod.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
						</p>
					</div>
				</div>

				<Button
					variant={weeklyPeriod.isActive ? "outline" : "default"}
					onClick={handleToggleActive}
					disabled={isProcessing}
				>
					<Power className="h-4 w-4 mr-2" />
					{weeklyPeriod.isActive ? "Desativar" : "Ativar"}
				</Button>
			</div>

			{/* Cards de estatísticas */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<DollarSign className="h-4 w-4 mr-2 text-primary" />
							Ganhos Brutos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">€ {stats.totalEarnings.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">
							{weeklyPeriod.weeklyGoal ? (
								<>
									{stats.totalEarnings >= weeklyPeriod.weeklyGoal
										? `${((stats.totalEarnings / weeklyPeriod.weeklyGoal) * 100).toFixed(0)}% da meta atingida`
										: `${((stats.totalEarnings / weeklyPeriod.weeklyGoal) * 100).toFixed(0)}% da meta de € ${weeklyPeriod.weeklyGoal.toFixed(2)}`}
								</>
							) : (
								"Nenhuma meta definida"
							)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<Fuel className="h-4 w-4 mr-2 text-primary" />
							Despesas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">€ {stats.totalExpenses.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">
							{stats.totalEarnings > 0
								? `${((stats.totalExpenses / stats.totalEarnings) * 100).toFixed(0)}% dos ganhos`
								: "0% dos ganhos"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<DollarSign className="h-4 w-4 mr-2 text-primary" />
							Ganhos Líquidos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">€ {stats.netEarnings.toFixed(2)}</div>
						<p className="text-xs text-muted-foreground">
							{stats.totalEarnings > 0
								? `${((stats.netEarnings / stats.totalEarnings) * 100).toFixed(0)}% dos ganhos brutos`
								: "0% dos ganhos brutos"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center">
							<Clock className="h-4 w-4 mr-2 text-primary" />
							Turnos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalShifts}</div>
						<p className="text-xs text-muted-foreground">
							{stats.totalShifts > 0
								? `Média de € ${(stats.totalEarnings / stats.totalShifts).toFixed(2)} por turno`
								: "Nenhum turno registrado"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs para diferentes seções */}
			<Tabs defaultValue="shifts" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="shifts">Turnos</TabsTrigger>
					<TabsTrigger value="expenses">Despesas</TabsTrigger>
					<TabsTrigger value="summary">Resumo</TabsTrigger>
				</TabsList>

				<TabsContent value="shifts" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Turnos</CardTitle>
							<CardDescription>Gerencie os turnos registrados neste período semanal.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex justify-end mb-4">
								<Button asChild>
									<Link href={`/dashboard/shifts/new?periodId=${weeklyPeriod.id}`}>Registrar Novo Turno</Link>
								</Button>
							</div>

							{stats.totalShifts === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<Calendar className="h-12 w-12 text-muted-foreground mb-4" />
									<h3 className="text-lg font-medium mb-2">Nenhum turno registrado</h3>
									<p className="text-muted-foreground mb-6">
										Registre seu primeiro turno para começar a acompanhar seus ganhos.
									</p>
									<Button asChild>
										<Link href={`/dashboard/shifts/new?periodId=${weeklyPeriod.id}`}>Registrar Turno</Link>
									</Button>
								</div>
							) : (
								<ShiftList shifts={weeklyPeriod.Shift || []} onDelete={handleDeleteShift}>
									{(shift) => (
										<Button variant="ghost" size="icon" asChild>
											<Link href={`/dashboard/shifts/edit/${shift.id}`}>
												<Edit className="h-4 w-4" />
											</Link>
										</Button>
									)}
								</ShiftList>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="expenses" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Despesas</CardTitle>
							<CardDescription>Gerencie as despesas registradas neste período semanal.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex justify-end mb-4">
								<Button asChild>
									<Link href={`/dashboard/expenses/new?periodId=${weeklyPeriod.id}`}>Registrar Nova Despesa</Link>
								</Button>
							</div>

							{stats.totalExpenses === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
									<h3 className="text-lg font-medium mb-2">Nenhuma despesa registrada</h3>
									<p className="text-muted-foreground mb-6">
										Registre suas despesas para ter um controle financeiro completo.
									</p>
									<Button asChild>
										<Link href={`/dashboard/expenses/new?periodId=${weeklyPeriod.id}`}>Registrar Despesa</Link>
									</Button>
								</div>
							) : (
								<ExpenseList expenses={weeklyPeriod.Expense || []} onDelete={handleDeleteExpense} />
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="summary" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Resumo do Período</CardTitle>
							<CardDescription>Visão geral do desempenho neste período semanal.</CardDescription>
						</CardHeader>
						<CardContent>
							{weeklyPeriod ? (
								<WeeklyPeriodSummary weeklyPeriod={weeklyPeriod} />
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<p className="text-muted-foreground">Carregando dados do resumo...</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
