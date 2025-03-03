"use client";

import { getShiftsByPeriod } from "@/actions/shift-actions";
import { getActiveWeeklyPeriod, getRecentWeeklyPeriods } from "@/actions/weekly-period-actions";
import { ProductivityCard } from "@/components/dashboard/productivity-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Calendar, Car, Euro } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [activePeriod, setActivePeriod] = useState<any>(null);
	const [recentPeriods, setRecentPeriods] = useState<any[]>([]);
	const [currentWeekShifts, setCurrentWeekShifts] = useState<any[]>([]);
	const [currentMonthShifts, setCurrentMonthShifts] = useState<any[]>([]);

	useEffect(() => {
		async function loadData() {
			try {
				// Carregar período ativo
				const activeResult = await getActiveWeeklyPeriod();
				if (activeResult && !("error" in activeResult)) {
					setActivePeriod(activeResult);

					// Carregar turnos do período ativo
					const shiftsResult = await getShiftsByPeriod(activeResult.id);
					if (shiftsResult && !("error" in shiftsResult)) {
						setCurrentWeekShifts(shiftsResult);
					}
				}

				// Carregar períodos recentes
				const periodsResult = await getRecentWeeklyPeriods();
				if (periodsResult && !("error" in periodsResult)) {
					setRecentPeriods(periodsResult);
				}

				// Carregar turnos do mês atual
				const now = new Date();
				const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

				// Implementar função para buscar turnos por intervalo de datas
				// Esta é uma simplificação - você precisará criar esta função no backend
				// const monthShiftsResult = await getShiftsByDateRange(firstDayOfMonth, lastDayOfMonth);
				// if (monthShiftsResult && !("error" in monthShiftsResult)) {
				//   setCurrentMonthShifts(monthShiftsResult);
				// }
			} catch (error) {
				console.error("Erro ao carregar dados do dashboard:", error);
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, []);

	// Calcular estatísticas do período ativo
	const totalEarnings = currentWeekShifts.reduce((sum, shift) => sum + (shift.totalEarnings || 0), 0);
	const totalDistance = currentWeekShifts.reduce((sum, shift) => sum + (shift.odometer || 0), 0);
	const remainingGoal = activePeriod?.weeklyGoal ? activePeriod.weeklyGoal - totalEarnings : 0;
	const goalProgress = activePeriod?.weeklyGoal ? (totalEarnings / activePeriod.weeklyGoal) * 100 : 0;

	return (
		<div className="container py-6 space-y-8">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold">Dashboard</h1>
					<p className="text-muted-foreground">Visão geral da sua atividade como motorista TVDE</p>
				</div>

				<div className="flex gap-2">
					<Button asChild>
						<Link href="/dashboard/shifts/new">Registrar Turno</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/dashboard/weekly-periods">Ver Períodos</Link>
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<Skeleton className="h-[180px] rounded-lg" />
					<Skeleton className="h-[180px] rounded-lg" />
					<Skeleton className="h-[180px] rounded-lg" />
				</div>
			) : (
				<>
					{activePeriod ? (
						<div className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg flex items-center">
											<Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
											Período Atual
										</CardTitle>
										<CardDescription>
											{format(new Date(activePeriod.startDate), "dd/MM", { locale: ptBR })} -{" "}
											{format(new Date(activePeriod.endDate), "dd/MM/yyyy", { locale: ptBR })}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Meta:</span>
												<span className="font-medium">{activePeriod.weeklyGoal.toFixed(2)} €</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Ganhos:</span>
												<span className="font-medium">{totalEarnings.toFixed(2)} €</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Restante:</span>
												<span className="font-medium">{remainingGoal > 0 ? remainingGoal.toFixed(2) : "0.00"} €</span>
											</div>

											<div className="mt-4">
												<div className="flex justify-between text-xs mb-1">
													<span>Progresso</span>
													<span>{Math.min(100, Math.round(goalProgress))}%</span>
												</div>
												<div className="w-full bg-muted rounded-full h-2">
													<div
														className="bg-primary h-2 rounded-full"
														style={{ width: `${Math.min(100, goalProgress)}%` }}
													/>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg flex items-center">
											<Euro className="mr-2 h-5 w-5 text-muted-foreground" />
											Ganhos da Semana
										</CardTitle>
										<CardDescription>Resumo financeiro do período atual</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Total Bruto:</span>
												<span className="font-medium">{totalEarnings.toFixed(2)} €</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Turnos:</span>
												<span className="font-medium">{currentWeekShifts.length}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Média por Turno:</span>
												<span className="font-medium">
													{currentWeekShifts.length > 0
														? (totalEarnings / currentWeekShifts.length).toFixed(2)
														: "0.00"}{" "}
													€
												</span>
											</div>

											<div className="flex justify-between border-t pt-2 mt-2">
												<span className="text-muted-foreground">Ganhos por Km:</span>
												<span className="font-medium">
													{totalDistance > 0 ? (totalEarnings / totalDistance).toFixed(2) : "0.00"} €/km
												</span>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg flex items-center">
											<Car className="mr-2 h-5 w-5 text-muted-foreground" />
											Quilometragem
										</CardTitle>
										<CardDescription>Distâncias percorridas no período</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Total:</span>
												<span className="font-medium">{totalDistance.toFixed(1)} km</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Média por Turno:</span>
												<span className="font-medium">
													{currentWeekShifts.length > 0 ? (totalDistance / currentWeekShifts.length).toFixed(1) : "0.0"}{" "}
													km
												</span>
											</div>

											<div className="flex justify-between border-t pt-2 mt-2">
												<span className="text-muted-foreground">Projeção Mensal:</span>
												<span className="font-medium">{(totalDistance * 4).toFixed(0)} km</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Card de Produtividade */}
							<ProductivityCard shifts={currentWeekShifts} period="week" />

							{/* Botão para ver detalhes do período */}
							<div className="flex justify-end">
								<Button asChild variant="outline">
									<Link href={`/dashboard/weekly-periods/${activePeriod.id}`}>
										Ver Detalhes do Período
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</div>
					) : (
						<Card>
							<CardHeader>
								<CardTitle>Nenhum Período Ativo</CardTitle>
								<CardDescription>Você não possui um período semanal ativo no momento.</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="mb-4">
									Para começar a registrar seus turnos e acompanhar seus ganhos, crie um novo período semanal.
								</p>
								<Button asChild>
									<Link href="/dashboard/weekly-periods/new">Criar Período Semanal</Link>
								</Button>
							</CardContent>
						</Card>
					)}

					{/* Períodos Recentes */}
					{recentPeriods.length > 0 && (
						<div className="mt-8">
							<h2 className="text-xl font-bold mb-4">Períodos Recentes</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{recentPeriods.map((period) => (
									<Card key={period.id}>
										<CardHeader className="pb-2">
											<CardTitle className="text-lg">{period.name || "Período Semanal"}</CardTitle>
											<CardDescription>
												{format(new Date(period.startDate), "dd/MM", { locale: ptBR })} -{" "}
												{format(new Date(period.endDate), "dd/MM/yyyy", { locale: ptBR })}
											</CardDescription>
										</CardHeader>
										<CardContent className="pb-2">
											<div className="flex justify-between mb-2">
												<span className="text-muted-foreground">Meta:</span>
												<span>{period.weeklyGoal.toFixed(2)} €</span>
											</div>
											{/* Aqui você pode adicionar mais informações sobre o período */}
										</CardContent>
										<div className="px-6 pb-4">
											<Button asChild variant="outline" className="w-full">
												<Link href={`/dashboard/weekly-periods/${period.id}`}>Ver Detalhes</Link>
											</Button>
										</div>
									</Card>
								))}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
