"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateEffectiveWorkTime, calculateHourlyRate } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface ProductivityCardProps {
	shifts: any[];
	period: "week" | "month" | "all";
}

export function ProductivityCard({ shifts, period }: ProductivityCardProps) {
	// Filtrar turnos com dados de tempo completos
	const shiftsWithTimeData = shifts.filter((shift) => shift.startTime && shift.endTime);

	// Calcular métricas
	const totalEarnings = shifts.reduce((sum, shift) => sum + (shift.totalEarnings || 0), 0);
	const totalDistance = shifts.reduce((sum, shift) => sum + (shift.odometer || 0), 0);

	const totalEffectiveHours = shiftsWithTimeData.reduce((total, shift) => {
		return (
			total + calculateEffectiveWorkTime(new Date(shift.startTime), new Date(shift.endTime), shift.breakMinutes || 0)
		);
	}, 0);

	const hourlyRate = calculateHourlyRate(totalEarnings, totalEffectiveHours);

	// Determinar o título com base no período
	const periodTitle = period === "week" ? "Esta Semana" : period === "month" ? "Este Mês" : "Todos os Tempos";

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center">
					<TrendingUp className="mr-2 h-5 w-5" />
					Produtividade ({periodTitle})
				</CardTitle>
				<CardDescription>Análise de produtividade baseada em {shiftsWithTimeData.length} turnos</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="text-2xl font-bold">{hourlyRate} €/h</div>
						<p className="text-xs text-muted-foreground">Ganhos por Hora</p>
					</div>

					<div className="space-y-2">
						<div className="text-2xl font-bold">
							{totalDistance > 0 ? (totalEarnings / totalDistance).toFixed(2) : "0.00"} €/km
						</div>
						<p className="text-xs text-muted-foreground">Ganhos por Km</p>
					</div>

					<div className="space-y-2">
						<div className="text-2xl font-bold">{totalEffectiveHours.toFixed(1)}h</div>
						<p className="text-xs text-muted-foreground">Horas Efetivas</p>
					</div>

					<div className="space-y-2">
						<div className="text-2xl font-bold">
							{totalEffectiveHours > 0 ? (totalDistance / totalEffectiveHours).toFixed(1) : "0.0"} km/h
						</div>
						<p className="text-xs text-muted-foreground">Velocidade Média</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
