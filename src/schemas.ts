import { ExpenseCategory, ExpenseFrequency, FuelType, PlatformType, ShiftType, VehicleOwnership } from "@prisma/client";
import { z } from "zod";

export const vehicleSchema = z
	.object({
		make: z.string().min(1, "Marca é obrigatória"),
		model: z.string().min(1, "Modelo é obrigatório"),
		year: z
			.number()
			.min(new Date().getFullYear() - 20, "Ano inválido")
			.max(new Date().getFullYear() + 1, "Ano inválido"),
		fuelType: z.nativeEnum(FuelType),
		isDefault: z.boolean().default(false),
		ownership: z.nativeEnum(VehicleOwnership),
		weeklyRent: z.number().min(0, "O valor não pode ser negativo").optional(),
		commissionRate: z
			.number()
			.min(0, "O valor não pode ser negativo")
			.max(100, "A porcentagem não pode ser maior que 100")
			.optional(),
		licensePlate: z.string().optional(),
	})
	.refine(
		(data) => {
			// Se for alugado, o valor do aluguel é obrigatório
			if (data.ownership === "RENTED" && (!data.weeklyRent || data.weeklyRent <= 0)) {
				return false;
			}
			// Se for comissão, a porcentagem é obrigatória
			if (data.ownership === "COMMISSION" && (!data.commissionRate || data.commissionRate <= 0)) {
				return false;
			}
			return true;
		},
		{
			message: "Informações adicionais obrigatórias para o tipo de propriedade selecionado",
			path: ["ownership"],
		},
	);

// Schema para períodos semanais
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

export const expenseSchema = z.object({
	date: z.date({
		required_error: "A data da despesa é obrigatória",
	}),
	amount: z.number().min(0.01, "O valor deve ser maior que zero"),
	category: z.nativeEnum(ExpenseCategory, {
		required_error: "A categoria é obrigatória",
	}),
	notes: z.string().optional(),
	weeklyPeriodId: z.string(),
});

export const shiftSchema = z
	.object({
		date: z.date({
			required_error: "A data do turno é obrigatória",
		}),
		uberEarnings: z.number().min(0, "O valor não pode ser negativo"),
		boltEarnings: z.number().min(0, "O valor não pode ser negativo"),
		otherEarnings: z.number().min(0, "O valor não pode ser negativo").optional().default(0),
		initialOdometer: z.number().min(0, "A quilometragem não pode ser negativa"),
		finalOdometer: z.number().min(0, "A quilometragem não pode ser negativa").optional(),
		odometer: z.number().min(0, "A quilometragem não pode ser negativa"),
		vehicleId: z.string(),
		notes: z.string().optional(),
		weeklyPeriodId: z.string(),
		expenses: z.array(expenseSchema).optional(),
	})
	.refine(
		(data) => {
			if (data.finalOdometer !== undefined && data.finalOdometer !== null) {
				return data.finalOdometer > data.initialOdometer;
			}
			return true;
		},
		{
			message: "A quilometragem final deve ser maior que a inicial",
			path: ["finalOdometer"],
		},
	);

export type ShiftFormData = z.infer<typeof shiftSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
