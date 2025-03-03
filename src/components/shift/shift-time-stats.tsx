"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";

interface ShiftTimeStatsProps {
	startTime: Date | null;
	endTime: Date | null;
	breakMinutes: number | null;
}

export function ShiftTimeStats({ startTime, endTime, breakMinutes = 0 }: ShiftTimeStatsProps) {
	// Se não tiver horários definidos, não mostra o componente
	if (!startTime || !endTime) {
		return null;
	}

	// Calcular tempo total em minutos
	const totalMinutes = differenceInMinutes(endTime, startTime);

	// Calcular tempo efetivo (descontando pausas)
	const effectiveMinutes = totalMinutes - (breakMinutes || 0);

	// Converter para horas e minutos
	const totalHours = Math.floor(totalMinutes / 60);
	const totalMins = totalMinutes % 60;

	const effectiveHours = Math.floor(effectiveMinutes / 60);
	const effectiveMins = effectiveMinutes % 60;

	return (
		<Card className="mt-4">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg flex items-center">
					<Clock className="mr-2 h-5 w-5" />
					Estatísticas de Tempo
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<h3 className="text-sm font-medium text-muted-foreground">Horário</h3>
						<p className="text-lg font-semibold">
							{format(startTime, "HH:mm", { locale: ptBR })} - {format(endTime, "HH:mm", { locale: ptBR })}
						</p>
					</div>

					<div>
						<h3 className="text-sm font-medium text-muted-foreground">Tempo Total</h3>
						<p className="text-lg font-semibold">
							{totalHours}h {totalMins}min
						</p>
					</div>

					<div>
						<h3 className="text-sm font-medium text-muted-foreground">Tempo Efetivo</h3>
						<p className="text-lg font-semibold">
							{effectiveHours}h {effectiveMins}min
							{breakMinutes ? ` (${breakMinutes}min de pausa)` : ""}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
