import { ExpenseCategory, ExpenseFrequency, FuelType, PlatformType, ShiftType } from "@prisma/client";
import { z } from "zod";

export const vehicleSchema = z.object({
	make: z.string().min(1, "Marca é obrigatória"),
	model: z.string().min(1, "Modelo é obrigatório"),
	year: z.number().min(new Date().getFullYear() - 7, "Ano inválido"),
	fuelType: z.nativeEnum(FuelType),
	isDefault: z.boolean().default(false),
});

// Schema para período semanal
export const weeklyPeriodSchema = z
	.object({
		name: z.string().optional(),
		startDate: z.date(),
		endDate: z.date(),
		isActive: z.boolean().default(true),
	})
	.refine(
		(data) => {
			// Verifica se a data de início é uma segunda-feira
			return new Date(data.startDate).getDay() === 1;
		},
		{
			message: "O período deve começar em uma segunda-feira",
			path: ["startDate"],
		},
	)
	.refine(
		(data) => {
			// Verifica se a data de fim é um domingo
			return new Date(data.endDate).getDay() === 0;
		},
		{
			message: "O período deve terminar em um domingo",
			path: ["endDate"],
		},
	);

// Schema para iniciar um turno
export const startShiftSchema = z.object({
	vehicleId: z.string().uuid("ID do veículo inválido"),
	type: z.nativeEnum(ShiftType, {
		errorMap: () => ({ message: "Tipo de turno inválido" }),
	}),
	startTime: z.date().default(() => new Date()),
	startMileage: z.number().positive("Quilometragem inicial deve ser positiva"),
});

// Schema para finalizar um turno
export const endShiftSchema = z.object({
	shiftId: z.string().uuid("ID do turno inválido"),
	endTime: z.date().default(() => new Date()),
	endMileage: z.number().positive("Quilometragem final deve ser positiva"),
});

// Schema para despesas do turno
export const shiftExpenseSchema = z.object({
	shiftId: z.string().uuid("ID do turno inválido"),
	category: z.nativeEnum(ExpenseCategory, {
		errorMap: () => ({ message: "Categoria de despesa inválida" }),
	}),
	amount: z.number().positive("Valor deve ser positivo"),
	description: z.string().optional(),
});

// Schema para rendimentos do turno
export const shiftIncomeSchema = z.object({
	shiftId: z.string().uuid("ID do turno inválido"),
	platform: z.nativeEnum(PlatformType, {
		errorMap: () => ({ message: "Plataforma inválida" }),
	}),
	amount: z.number().positive("Valor deve ser positivo"),
	tripCount: z.number().int().nonnegative().optional(),
	description: z.string().optional(),
	isExtendedHour: z.boolean().default(false),
});

// Schema para objetivos do usuário
export const userGoalSchema = z.object({
	weeklyNetIncome: z.number().positive("Valor deve ser positivo").optional(),
	monthlyNetIncome: z.number().positive("Valor deve ser positivo"),
	workDaysPerWeek: z.number().int().min(1).max(7),
	workHoursPerDay: z.number().positive().max(24),
});

// Schema para despesas fixas
export const fixedExpenseSchema = z.object({
	name: z.string().min(1, "Nome da despesa é obrigatório"),
	amount: z.number().positive("Valor deve ser positivo"),
	frequency: z.nativeEnum(ExpenseFrequency),
	dueDay: z.number().int().min(1).max(31).optional(),
});

// Tipos derivados dos schemas
export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type StartShiftFormData = z.infer<typeof startShiftSchema>;
export type EndShiftFormData = z.infer<typeof endShiftSchema>;
export type ShiftExpenseFormData = z.infer<typeof shiftExpenseSchema>;
export type ShiftIncomeFormData = z.infer<typeof shiftIncomeSchema>;
export type UserGoalFormData = z.infer<typeof userGoalSchema>;
export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;
export type WeeklyPeriodFormData = z.infer<typeof weeklyPeriodSchema>;
