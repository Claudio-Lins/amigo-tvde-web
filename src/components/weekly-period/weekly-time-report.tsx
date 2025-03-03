"use client";

import { Card, CardContent } from "@/components/ui/card";
import { calculateEffectiveWorkTime } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface WeeklyTimeReportProps {
	shifts: any[];
}

export function WeeklyTimeReport({ shifts }: WeeklyTimeReportProps) {
	// Ordenar turnos por data
	const sortedShifts = [...shifts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	// Preparar dados para o gráfico
	const chartData = sortedShifts.map((shift) => {
		const startTime = new Date(shift.startTime);
		const endTime = new Date(shift.endTime);
		const breakMinutes = shift.breakMinutes || 0;

		const effectiveHours = calculateEffectiveWorkTime(startTime, endTime, breakMinutes);
		const breakHours = breakMinutes / 60;

		return {
			date: format(new Date(shift.date), "dd/MM", { locale: ptBR }),
			horasEfetivas: Number.parseFloat(effectiveHours.toFixed(1)),
			pausas: Number.parseFloat(breakHours.toFixed(1)),
		};
	});

	// Calcular estatísticas
	const totalEffectiveHours = sortedShifts.reduce((total, shift) => {
		if (shift.startTime && shift.endTime) {
			const startTime = new Date(shift.startTime);
			const endTime = new Date(shift.endTime);
			const breakMinutes = shift.breakMinutes || 0;

			return total + calculateEffectiveWorkTime(startTime, endTime, breakMinutes);
		}
		return total;
	}, 0);

	const totalBreakHours = sortedShifts.reduce((total, shift) => {
		return total + (shift.breakMinutes || 0) / 60;
	}, 0);

	const averageHoursPerDay = totalEffectiveHours / sortedShifts.length;
	const longestDay = Math.max(
		...sortedShifts.map((shift) =>
			calculateEffectiveWorkTime(new Date(shift.startTime), new Date(shift.endTime), shift.breakMinutes || 0),
		),
	);

	// Calcular horários mais comuns
	const startTimes = sortedShifts.map((shift) => format(new Date(shift.startTime), "HH:mm", { locale: ptBR }));
	const startTimeCount = startTimes.reduce(
		(acc, time) => {
			acc[time] = (acc[time] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const mostCommonStartTime = Object.entries(startTimeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center">
							<Clock className="h-8 w-8 text-primary mb-2" />
							<h3 className="text-lg font-medium">Total de Horas</h3>
							<p className="text-3xl font-bold">{totalEffectiveHours.toFixed(1)}h</p>
							<p className="text-sm text-muted-foreground">Tempo efetivo de trabalho</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center">
							<h3 className="text-lg font-medium">Média Diária</h3>
							<p className="text-3xl font-bold">{averageHoursPerDay.toFixed(1)}h</p>
							<p className="text-sm text-muted-foreground">Horas por dia de trabalho</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center">
							<h3 className="text-lg font-medium">Dia Mais Longo</h3>
							<p className="text-3xl font-bold">{longestDay.toFixed(1)}h</p>
							<p className="text-sm text-muted-foreground">Maior jornada no período</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center">
							<h3 className="text-lg font-medium">Horário Comum</h3>
							<p className="text-3xl font-bold">{mostCommonStartTime}</p>
							<p className="text-sm text-muted-foreground">Horário de início mais frequente</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardContent className="pt-6">
					<h3 className="text-lg font-medium mb-4">Distribuição de Horas por Dia</h3>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis label={{ value: "Horas", angle: -90, position: "insideLeft" }} />
								<Tooltip formatter={(value) => [`${value} horas`, ""]} />
								<Legend />
								<Bar dataKey="horasEfetivas" name="Horas Efetivas" fill="#3b82f6" />
								<Bar dataKey="pausas" name="Pausas" fill="#ef4444" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<h3 className="text-lg font-medium mb-4">Detalhes por Turno</h3>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b">
									<th className="text-left py-2 px-4">Data</th>
									<th className="text-left py-2 px-4">Início</th>
									<th className="text-left py-2 px-4">Término</th>
									<th className="text-left py-2 px-4">Pausas</th>
									<th className="text-left py-2 px-4">Horas Efetivas</th>
								</tr>
							</thead>
							<tbody>
								{sortedShifts.map((shift) => {
									const startTime = new Date(shift.startTime);
									const endTime = new Date(shift.endTime);
									const breakMinutes = shift.breakMinutes || 0;
									const effectiveHours = calculateEffectiveWorkTime(startTime, endTime, breakMinutes);

									return (
										<tr key={shift.id} className="border-b hover:bg-muted/50">
											<td className="py-2 px-4">{format(new Date(shift.date), "dd/MM/yyyy", { locale: ptBR })}</td>
											<td className="py-2 px-4">{format(startTime, "HH:mm", { locale: ptBR })}</td>
											<td className="py-2 px-4">{format(endTime, "HH:mm", { locale: ptBR })}</td>
											<td className="py-2 px-4">{breakMinutes} min</td>
											<td className="py-2 px-4 font-medium">{effectiveHours.toFixed(1)}h</td>
										</tr>
									);
								})}
							</tbody>
							<tfoot>
								<tr className="border-t font-medium">
									<td className="py-2 px-4" colSpan={3}>
										Total
									</td>
									<td className="py-2 px-4">{Math.round((totalBreakHours * 60) / 60).toFixed(1)} h</td>
									<td className="py-2 px-4">{totalEffectiveHours.toFixed(1)}h</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
