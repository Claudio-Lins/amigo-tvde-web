"use client";

import { deleteExpense } from "@/actions/expense-actions";
import { deleteShift, getShiftsByPeriod } from "@/actions/shift-actions";
import { getWeeklyPeriodById, toggleWeeklyPeriodActive } from "@/actions/weekly-period-actions";
import { ExpenseList } from "@/components/expense/expense-list";
import { ShiftList } from "@/components/shift/shift-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyPeriodSummary } from "@/components/weekly-period/weekly-period-summary";
import { WeeklyTimeReport } from "@/components/weekly-period/weekly-time-report";
import { Expense, Shift, WeeklyPeriod } from "@prisma/client";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, Check, Clock, DollarSign, Edit, Euro, Fuel, Power } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Estender a interface Shift para incluir otherEarnings e campos de horário
interface ExtendedShift extends Shift {
	otherEarnings: number | null;
	startTime: Date | null;
	endTime: Date | null;
	breakMinutes: number | null;
}

// Atualizar a interface WeeklyPeriodWithRelations
interface WeeklyPeriodWithRelations extends WeeklyPeriod {
	Shift?: ExtendedShift[];
	Expense?: Expense[];
}

export default function WeeklyPeriodDetailsPage() {
	const router = useRouter();
	const params = useParams();
	const periodId = params.id as string;
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [weeklyPeriod, setWeeklyPeriod] = useState<WeeklyPeriodWithRelations | null>(null);
	const [activeTab, setActiveTab] = useState("shifts");

	useEffect(() => {
		async function loadWeeklyPeriod() {
			try {
				const result = await getWeeklyPeriodById(periodId);
				if (result && !("error" in result)) {
					setWeeklyPeriod(result);
				} else {
					toast.error("Erro ao carregar período semanal");
					router.push("/dashboard/weekly-periods");
				}
			} catch (error) {
				console.error("Erro ao carregar período:", error);
				toast.error("Erro ao carregar período semanal");
			} finally {
				setIsLoading(false);
			}
		}

		loadWeeklyPeriod();
	}, [periodId, router]);

	async function handleToggleActive() {
		if (!weeklyPeriod) return;

		setIsProcessing(true);
		try {
			const result = await toggleWeeklyPeriodActive(periodId);
			if (result && !("error" in result)) {
				setWeeklyPeriod({
					...weeklyPeriod,
					isActive: !weeklyPeriod.isActive,
				});
				toast.success(
					weeklyPeriod.isActive ? "Período semanal desativado com sucesso" : "Período semanal ativado com sucesso",
				);
			} else {
				toast.error(result.error || "Erro ao alterar status do período");
			}
		} catch (error) {
			console.error("Erro ao alterar status:", error);
			toast.error("Erro ao alterar status do período");
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleDeleteShift(shiftId: string) {
		if (!weeklyPeriod) return;

		try {
			const result = await deleteShift(shiftId);
			if (result && !("error" in result)) {
				// Atualizar o estado local removendo o turno excluído
				setWeeklyPeriod({
					...weeklyPeriod,
					Shift: weeklyPeriod.Shift?.filter((shift) => shift.id !== shiftId),
				});
				toast.success("Turno excluído com sucesso");
			} else {
				toast.error(result.error || "Erro ao excluir turno");
			}
		} catch (error) {
			console.error("Erro ao excluir turno:", error);
			toast.error("Erro ao excluir turno");
		}
	}

	async function handleDeleteExpense(expenseId: string) {
		if (!weeklyPeriod) return;

		try {
			const result = await deleteExpense(expenseId);
			if (result && !("error" in result)) {
				// Atualizar o estado local removendo a despesa excluída
				setWeeklyPeriod({
					...weeklyPeriod,
					Expense: weeklyPeriod.Expense?.filter((expense) => expense.id !== expenseId),
				});
				toast.success("Despesa excluída com sucesso");
			} else {
				toast.error(result.error || "Erro ao excluir despesa");
			}
		} catch (error) {
			console.error("Erro ao excluir despesa:", error);
			toast.error("Erro ao excluir despesa");
		}
	}

	// Calcular métricas de tempo
	const shiftsWithTimeData = weeklyPeriod?.Shift?.filter((shift) => shift.startTime && shift.endTime) || [];
	const totalWorkHours = shiftsWithTimeData.reduce((total, shift) => {
		if (shift.startTime && shift.endTime) {
			const startTime = new Date(shift.startTime);
			const endTime = new Date(shift.endTime);
			const breakMinutes = shift.breakMinutes || 0;

			const diffMs = endTime.getTime() - startTime.getTime();
			const diffHours = diffMs / (1000 * 60 * 60);
			const breakHours = breakMinutes / 60;

			return total + (diffHours - breakHours);
		}
		return total;
	}, 0);

	if (isLoading) {
		return (
			<div className="container py-6 md:py-0 space-y-6">
				<div className="flex items-center">
					<Button variant="ghost" size="icon" asChild className="mr-2">
						<Link href="/dashboard/weekly-periods">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<Skeleton className="h-9 w-64" />
				</div>
				<Skeleton className="h-[500px] w-full" />
			</div>
		);
	}

	if (!weeklyPeriod) {
		return (
			<div className="container py-6 md:py-0">
				<div className="flex items-center">
					<Button variant="ghost" size="icon" asChild className="mr-2">
						<Link href="/dashboard/weekly-periods">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<h1 className="text-3xl font-bold">Período não encontrado</h1>
				</div>
				<p className="mt-4">O período semanal solicitado não foi encontrado.</p>
			</div>
		);
	}

	// Calcular duração do período em dias
	const startDate = new Date(weeklyPeriod.startDate);
	const endDate = new Date(weeklyPeriod.endDate);
	const durationDays = differenceInDays(endDate, startDate) + 1;

	return (
		<div className="container py-6 md:py-0 space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div className="flex items-center">
					<Button variant="ghost" size="icon" asChild className="mr-2">
						<Link href="/dashboard/weekly-periods">
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
					<h1 className="text-3xl font-bold">{weeklyPeriod.name || "Período Semanal"}</h1>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant={weeklyPeriod.isActive ? "default" : "outline"}
						onClick={handleToggleActive}
						disabled={isProcessing}
					>
						<Power className="mr-2 h-4 w-4" />
						{weeklyPeriod.isActive ? "Desativar Período" : "Ativar Período"}
					</Button>

					<Button variant="outline" asChild>
						<Link href={`/dashboard/weekly-periods/${periodId}/edit`}>
							<Edit className="mr-2 h-4 w-4" />
							Editar
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg">Período</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center space-x-2">
							<Calendar strokeWidth={2.5} className="size-5" />
							<span>
								{format(startDate, "dd/MM/yyyy", { locale: ptBR })} - {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
							</span>
						</div>
						<div className="mt-2 text-sm text-muted-foreground">Duração: {durationDays} dias</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg">Meta Semanal</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center space-x-2">
							<Euro strokeWidth={2.5} className="size-5" />
							<span className="text-xl font-bold">
								{weeklyPeriod.weeklyGoal ? ` ${weeklyPeriod.weeklyGoal.toFixed(2)}` : "Não definida"}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg">Tempo de Trabalho</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center space-x-2">
							<Clock strokeWidth={2.5} className="size-5" />
							<span className="text-xl font-bold">{totalWorkHours.toFixed(1)}h</span>
						</div>
						<div className="mt-2 text-sm text-muted-foreground">
							{shiftsWithTimeData.length} turno(s) com registro de horário
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="shifts" value={activeTab} onValueChange={setActiveTab} className="md:w-full">
				<TabsList className="md:w-full flex justify-around">
					<TabsTrigger className="w-full cursor-pointer" value="shifts">
						Turnos
					</TabsTrigger>
					<TabsTrigger className="w-full cursor-pointer" value="expenses">
						Despesas
					</TabsTrigger>
					<TabsTrigger className="w-full cursor-pointer" value="time">
						Horários
					</TabsTrigger>
					<TabsTrigger className="w-full cursor-pointer" value="summary">
						Resumo
					</TabsTrigger>
				</TabsList>

				<TabsContent value="shifts" className="mt-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Turnos</CardTitle>
								<CardDescription>Gerencie os turnos deste período semanal.</CardDescription>
							</div>
							<Button asChild>
								<Link href={`/dashboard/shifts/new?weeklyPeriodId=${periodId}`}>Novo Turno</Link>
							</Button>
						</CardHeader>
						<CardContent>
							{weeklyPeriod.Shift && weeklyPeriod.Shift.length > 0 ? (
								<ShiftList shifts={weeklyPeriod.Shift} onDelete={handleDeleteShift} />
							) : (
								<div className="text-center py-8">
									<p className="text-muted-foreground">Nenhum turno registrado para este período.</p>
									<Button className="mt-4" asChild>
										<Link href={`/dashboard/shifts/new?weeklyPeriodId=${periodId}`}>Registrar Primeiro Turno</Link>
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="expenses" className="mt-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Despesas</CardTitle>
								<CardDescription>Gerencie as despesas deste período semanal.</CardDescription>
							</div>
							<Button asChild>
								<Link href={`/dashboard/expenses/new?weeklyPeriodId=${periodId}`}>Nova Despesa</Link>
							</Button>
						</CardHeader>
						<CardContent>
							{weeklyPeriod.Expense && weeklyPeriod.Expense.length > 0 ? (
								<ExpenseList expenses={weeklyPeriod.Expense} onDelete={handleDeleteExpense} />
							) : (
								<div className="text-center py-8">
									<p className="text-muted-foreground">Nenhuma despesa registrada para este período.</p>
									<Button className="mt-4" asChild>
										<Link href={`/dashboard/expenses/new?weeklyPeriodId=${periodId}`}>Registrar Primeira Despesa</Link>
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="time" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Relatório de Horários</CardTitle>
							<CardDescription>Análise dos horários de trabalho neste período.</CardDescription>
						</CardHeader>
						<CardContent>
							{shiftsWithTimeData.length > 0 ? (
								<WeeklyTimeReport shifts={shiftsWithTimeData} />
							) : (
								<div className="text-center py-8">
									<p className="text-muted-foreground">Nenhum turno com registro de horário neste período.</p>
									<p className="text-sm text-muted-foreground mt-2">
										Adicione horários de início e término aos seus turnos para visualizar estatísticas de tempo.
									</p>
								</div>
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
