import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Calcula o tempo efetivo de trabalho em horas
 * @param startTime Hora de início
 * @param endTime Hora de término
 * @param breakMinutes Tempo de pausa em minutos
 * @returns Tempo efetivo em horas (com 2 casas decimais)
 */
export function calculateEffectiveWorkTime(startTime?: Date, endTime?: Date, breakMinutes = 0): number {
	if (!startTime || !endTime) return 0;

	// Calcular a diferença em milissegundos
	const diffMs = endTime.getTime() - startTime.getTime();

	// Converter para horas e descontar as pausas
	const totalHours = diffMs / (1000 * 60 * 60);
	const breakHours = breakMinutes / 60;

	const effectiveHours = totalHours - breakHours;

	// Retornar com 2 casas decimais, não permitindo valores negativos
	return Math.max(0, Number.parseFloat(effectiveHours.toFixed(2)));
}

/**
 * Calcula a produtividade por hora (ganhos por hora efetiva)
 * @param totalEarnings Ganhos totais
 * @param effectiveHours Horas efetivas de trabalho
 * @returns Produtividade por hora (com 2 casas decimais)
 */
export function calculateHourlyRate(totalEarnings: number, effectiveHours: number): number {
	if (effectiveHours <= 0) return 0;

	const hourlyRate = totalEarnings / effectiveHours;
	return Number.parseFloat(hourlyRate.toFixed(2));
}
