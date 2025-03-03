import { z } from "zod";

export const weeklyPeriodSchema = z.object({
	name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
	startDate: z.date({
		required_error: "A data de início é obrigatória",
	}),
	endDate: z.date({
		required_error: "A data de término é obrigatória",
	}),
	weeklyGoal: z.number().min(0, "A meta não pode ser negativa").optional(),
	isActive: z.boolean().default(false),
});

export const shiftSchema = z.object({
	date: z.date({
		required_error: "A data do turno é obrigatória",
	}),
	uberEarnings: z.number().min(0, "O valor não pode ser negativo"),
	boltEarnings: z.number().min(0, "O valor não pode ser negativo"),
	odometer: z.number().min(0, "A quilometragem não pode ser negativa"),
	vehicleId: z.string().min(1, "É necessário selecionar um veículo"),
	notes: z.string().optional(),
	weeklyPeriodId: z.string().min(1, "É necessário selecionar um período semanal"),
	startTime: z.date().optional(),
	endTime: z.date().optional(),
	breakMinutes: z.number().min(0, "O tempo de pausa não pode ser negativo").default(0),
});

export const fuelRecordSchema = z.object({
	date: z.date({
		required_error: "A data é obrigatória",
	}),
	odometer: z.number().min(0, "A quilometragem não pode ser negativa"),
	amount: z.number().min(0, "A quantidade não pode ser negativa"),
	price: z.number().min(0, "O preço não pode ser negativo"),
	totalCost: z.number().min(0, "O preço total não pode ser negativo"),
	fullTank: z.boolean().default(true),
	notes: z.string().optional(),
	vehicleId: z.string(),
	chargingMethod: z.enum(["volume", "time"]).optional(),
});
