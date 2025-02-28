"use server";

import { prisma } from "@/lib/prisma";
import { StartShiftFormData, shiftExpenseSchema, shiftIncomeSchema, startShiftSchema } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import { ExpenseCategory, PlatformType, ShiftType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Tipo para os dados de inicialização de turno com despesas e rendimentos
type StartShiftWithExpensesAndIncomes = StartShiftFormData & {
	expenses?: {
		category: ExpenseCategory;
		amount: number;
		description?: string;
	}[];
	incomes?: {
		platform: PlatformType;
		amount: number;
		tripCount?: number;
		description?: string;
		isExtendedHour?: boolean;
	}[];
};

/**
 * Inicia um novo turno com despesas e rendimentos opcionais
 */
export async function startShift(data: StartShiftWithExpensesAndIncomes) {
	try {
		// Verificar autenticação
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Não autorizado. Faça login para continuar." };
		}

		// Validar dados do turno
		const validatedData = startShiftSchema.safeParse(data);
		if (!validatedData.success) {
			return { error: "Dados inválidos para iniciar o turno." };
		}

		// Buscar o usuário pelo clerkUserId
		const user = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!user) {
			return { error: "Usuário não encontrado." };
		}

		// Verificar se o veículo pertence ao usuário
		const vehicle = await prisma.vehicle.findFirst({
			where: {
				id: data.vehicleId,
				userId: user.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado ou não pertence ao usuário." };
		}

		// Verificar se há um período semanal ativo
		const activeWeeklyPeriod = await prisma.weeklyPeriod.findFirst({
			where: {
				userId: user.id,
				isActive: true,
				startDate: {
					lte: data.startTime,
				},
				endDate: {
					gte: data.startTime,
				},
			},
		});

		// Criar o turno
		const shift = await prisma.shift.create({
			data: {
				userId: user.id,
				vehicleId: data.vehicleId,
				type: data.type,
				startTime: data.startTime,
				startMileage: data.startMileage,
				weeklyPeriodId: activeWeeklyPeriod?.id,
			},
		});

		// Adicionar despesas, se houver
		if (data.expenses && data.expenses.length > 0) {
			const expensePromises = data.expenses.map(async (expense) => {
				// Validar cada despesa
				const validatedExpense = shiftExpenseSchema.safeParse({
					...expense,
					shiftId: shift.id,
				});

				if (validatedExpense.success) {
					return prisma.shiftExpense.create({
						data: {
							shiftId: shift.id,
							category: expense.category,
							amount: expense.amount,
							description: expense.description,
						},
					});
				}
				return null;
			});

			await Promise.all(expensePromises.filter(Boolean));
		}

		// Adicionar rendimentos, se houver
		if (data.incomes && data.incomes.length > 0) {
			const incomePromises = data.incomes.map(async (income) => {
				// Validar cada rendimento
				const validatedIncome = shiftIncomeSchema.safeParse({
					...income,
					shiftId: shift.id,
				});

				if (validatedIncome.success) {
					return prisma.shiftIncome.create({
						data: {
							shiftId: shift.id,
							platform: income.platform,
							amount: income.amount,
							tripCount: income.tripCount,
							description: income.description,
							isExtendedHour: income.isExtendedHour || false,
						},
					});
				}
				return null;
			});

			await Promise.all(incomePromises.filter(Boolean));
		}

		// Revalidar o caminho para atualizar os dados
		revalidatePath("/dashboard/shifts");

		// Retornar sucesso com o ID do turno criado
		return { success: true, shiftId: shift.id };
	} catch (error) {
		console.error("Erro ao iniciar turno:", error);
		return { error: "Ocorreu um erro ao iniciar o turno. Tente novamente." };
	}
}

/**
 * Finaliza um turno existente
 */
export async function endShift(data: {
	shiftId: string;
	endTime: Date;
	endMileage: number;
	expenses?: {
		category: ExpenseCategory;
		amount: number;
		description?: string;
	}[];
	incomes?: {
		platform: PlatformType;
		amount: number;
		tripCount?: number;
		description?: string;
		isExtendedHour?: boolean;
	}[];
}) {
	try {
		// Verificar autenticação
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Não autorizado. Faça login para continuar." };
		}

		// Buscar o usuário pelo clerkUserId
		const user = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!user) {
			return { error: "Usuário não encontrado." };
		}

		// Verificar se o turno existe e pertence ao usuário
		const shift = await prisma.shift.findFirst({
			where: {
				id: data.shiftId,
				userId: user.id,
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado ou não pertence ao usuário." };
		}

		// Verificar se o turno já foi finalizado
		if (shift.endTime) {
			return { error: "Este turno já foi finalizado." };
		}

		// Verificar se a quilometragem final é maior que a inicial
		if (data.endMileage <= shift.startMileage) {
			return { error: "A quilometragem final deve ser maior que a inicial." };
		}

		// Atualizar o turno
		const updatedShift = await prisma.shift.update({
			where: { id: data.shiftId },
			data: {
				endTime: data.endTime,
				endMileage: data.endMileage,
			},
		});

		// Adicionar despesas, se houver
		if (data.expenses && data.expenses.length > 0) {
			const expensePromises = data.expenses.map(async (expense) => {
				return prisma.shiftExpense.create({
					data: {
						shiftId: shift.id,
						category: expense.category,
						amount: expense.amount,
						description: expense.description,
					},
				});
			});

			await Promise.all(expensePromises);
		}

		// Adicionar rendimentos, se houver
		if (data.incomes && data.incomes.length > 0) {
			const incomePromises = data.incomes.map(async (income) => {
				return prisma.shiftIncome.create({
					data: {
						shiftId: shift.id,
						platform: income.platform,
						amount: income.amount,
						tripCount: income.tripCount,
						description: income.description,
						isExtendedHour: income.isExtendedHour || false,
					},
				});
			});

			await Promise.all(incomePromises);
		}

		// Revalidar o caminho para atualizar os dados
		revalidatePath("/dashboard/shifts");

		// Retornar sucesso
		return { success: true, shiftId: shift.id };
	} catch (error) {
		console.error("Erro ao finalizar turno:", error);
		return { error: "Ocorreu um erro ao finalizar o turno. Tente novamente." };
	}
}

/**
 * Obtém os detalhes de um turno específico
 */
export async function getShiftDetails(shiftId: string) {
	try {
		// Verificar autenticação
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Não autorizado. Faça login para continuar." };
		}

		// Buscar o usuário pelo clerkUserId
		const user = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!user) {
			return { error: "Usuário não encontrado." };
		}

		// Buscar o turno com todas as relações
		const shift = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				userId: user.id,
			},
			include: {
				vehicle: true,
				expenses: true,
				incomes: true,
				weeklyPeriod: true,
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado ou não pertence ao usuário." };
		}

		return { success: true, shift };
	} catch (error) {
		console.error("Erro ao buscar detalhes do turno:", error);
		return { error: "Ocorreu um erro ao buscar os detalhes do turno." };
	}
}

/**
 * Obtém todos os turnos do usuário
 */
export async function getUserShifts(options?: {
	limit?: number;
	offset?: number;
	orderBy?: {
		field: string;
		direction: "asc" | "desc";
	};
	filter?: {
		startDate?: Date;
		endDate?: Date;
		type?: ShiftType;
		vehicleId?: string;
		weeklyPeriodId?: string;
	};
}) {
	try {
		// Verificar autenticação
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Não autorizado. Faça login para continuar." };
		}

		// Buscar o usuário pelo clerkUserId
		const user = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!user) {
			return { error: "Usuário não encontrado." };
		}

		// Construir o filtro
		const filter: any = {
			userId: user.id,
		};

		if (options?.filter) {
			if (options.filter.startDate) {
				filter.startTime = {
					...filter.startTime,
					gte: options.filter.startDate,
				};
			}

			if (options.filter.endDate) {
				filter.startTime = {
					...filter.startTime,
					lte: options.filter.endDate,
				};
			}

			if (options.filter.type) {
				filter.type = options.filter.type;
			}

			if (options.filter.vehicleId) {
				filter.vehicleId = options.filter.vehicleId;
			}

			if (options.filter.weeklyPeriodId) {
				filter.weeklyPeriodId = options.filter.weeklyPeriodId;
			}
		}

		// Construir a ordenação
		const orderBy: any = {};
		if (options?.orderBy) {
			orderBy[options.orderBy.field] = options.orderBy.direction;
		} else {
			orderBy.startTime = "desc";
		}

		// Contar o total de turnos
		const totalCount = await prisma.shift.count({
			where: filter,
		});

		// Buscar os turnos
		const shifts = await prisma.shift.findMany({
			where: filter,
			include: {
				vehicle: true,
				expenses: true,
				incomes: true,
				weeklyPeriod: true,
			},
			orderBy,
			skip: options?.offset || 0,
			take: options?.limit || 10,
		});

		return {
			success: true,
			shifts,
			pagination: {
				total: totalCount,
				offset: options?.offset || 0,
				limit: options?.limit || 10,
			},
		};
	} catch (error) {
		console.error("Erro ao buscar turnos:", error);
		return { error: "Ocorreu um erro ao buscar os turnos." };
	}
}

/**
 * Exclui um turno
 */
export async function deleteShift(shiftId: string) {
	try {
		// Verificar autenticação
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Não autorizado. Faça login para continuar." };
		}

		// Buscar o usuário pelo clerkUserId
		const user = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!user) {
			return { error: "Usuário não encontrado." };
		}

		// Verificar se o turno existe e pertence ao usuário
		const shift = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				userId: user.id,
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado ou não pertence ao usuário." };
		}

		// Excluir despesas e rendimentos relacionados
		await prisma.shiftExpense.deleteMany({
			where: { shiftId },
		});

		await prisma.shiftIncome.deleteMany({
			where: { shiftId },
		});

		// Excluir o turno
		await prisma.shift.delete({
			where: { id: shiftId },
		});

		// Revalidar o caminho para atualizar os dados
		revalidatePath("/dashboard/shifts");

		return { success: true };
	} catch (error) {
		console.error("Erro ao excluir turno:", error);
		return { error: "Ocorreu um erro ao excluir o turno. Tente novamente." };
	}
}
