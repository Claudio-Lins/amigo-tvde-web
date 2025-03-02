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
	vehicleId: z.string(),
	notes: z.string().optional(),
	weeklyPeriodId: z.string(),
});
