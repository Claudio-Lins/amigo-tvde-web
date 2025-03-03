"use server";

import { prisma } from "@/lib/prisma";
import {
	StartShiftFormData,
	shiftExpenseSchema,
	shiftIncomeSchema,
	shiftSchema,
	startShiftSchema,
	type ShiftFormData,
} from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import { ExpenseCategory, PlatformType, ShiftType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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
				date: data.startTime,
				odometer: data.startMileage,
				weeklyPeriodId: activeWeeklyPeriod?.id,
				uberEarnings: 0,
				boltEarnings: 0,
			},
		});

		const vehicleExpenses = vehicle?.ownership === "RENTED" && vehicle?.weeklyRent;

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
		const hasIncomes = await prisma.shiftIncome.findFirst({
			where: { shiftId: data.shiftId },
		});

		if (hasIncomes) {
			return { error: "Este turno já foi finalizado." };
		}

		// Verificar se a quilometragem final é maior que a inicial
		if (data.endMileage <= shift.odometer) {
			return { error: "A quilometragem final deve ser maior que a inicial." };
		}

		// Atualizar o turno
		const updatedShift = await prisma.shift.update({
			where: { id: data.shiftId },
			data: {
				notes: `Turno finalizado em ${data.endTime.toISOString()}`,
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
				ShiftIncome: true,
				ShiftExpense: true,
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
export async function getUserShifts() {
	try {
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			return { error: "Usuário não encontrado no banco de dados" };
		}

		const shifts = await prisma.shift.findMany({
			where: { userId: dbUser.id },
			orderBy: { date: "desc" },
			include: {
				weeklyPeriod: true,
				expenses: true,
				ShiftExpense: true,
				ShiftIncome: true,
			},
		});

		return shifts;
	} catch (error) {
		console.error("Erro ao buscar turnos:", error);
		return { error: "Falha ao buscar turnos" };
	}
}

/**
 * Exclui um turno
 */
export async function deleteShift(shiftId: string) {
	try {
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			return { error: "Usuário não encontrado no banco de dados" };
		}

		// Verificar se o turno existe e pertence ao usuário
		const shift = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				userId: dbUser.id,
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado" };
		}

		// Obter o ID do período semanal para revalidação
		const weeklyPeriodId = shift.weeklyPeriodId;

		// Excluir o turno
		await prisma.shift.delete({
			where: { id: shiftId },
		});

		revalidatePath(`/dashboard/weekly-periods/${weeklyPeriodId}`);
		return { success: true };
	} catch (error) {
		console.error("Erro ao excluir turno:", error);
		return { error: "Falha ao excluir turno" };
	}
}

export async function addShift(data: ShiftFormData) {
	try {
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			return { error: "Usuário não encontrado no banco de dados" };
		}

		// Verificar se o veículo existe e pertence ao usuário
		const vehicle = await prisma.vehicle.findUnique({
			where: {
				id: data.vehicleId,
				userId: dbUser.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado" };
		}

		// Verificar se há um período semanal ativo
		const activePeriod = await prisma.weeklyPeriod.findFirst({
			where: {
				userId: dbUser.id,
				isActive: true,
				startDate: {
					lte: data.date,
				},
				endDate: {
					gte: data.date,
				},
			},
		});

		if (!activePeriod) {
			return { error: "Não há um período semanal ativo para esta data. Por favor, crie ou ative um período." };
		}

		// Criar o turno
		const shift = await prisma.shift.create({
			data: {
				date: data.date,
				uberEarnings: data.uberEarnings,
				boltEarnings: data.boltEarnings,
				odometer: data.odometer,
				notes: data.notes,
				userId: dbUser.id,
				vehicleId: data.vehicleId,
				weeklyPeriodId: activePeriod.id,
			},
		});

		// Criar despesas associadas ao turno, se houver
		if (data.expenses && data.expenses.length > 0) {
			await Promise.all(
				data.expenses.map((expense) =>
					prisma.expense.create({
						data: {
							date: data.date,
							amount: expense.amount,
							category: expense.category,
							notes: expense.notes,
							shiftId: shift.id,
							userId: dbUser.id,
							weeklyPeriodId: activePeriod.id,
						},
					}),
				),
			);
		}

		revalidatePath("/dashboard/shifts");
		return { success: true, shift };
	} catch (error) {
		console.error("Erro ao criar turno:", error);
		return { error: "Falha ao adicionar turno" };
	}
}

export async function createShift(data: any) {
	try {
		// Verificar se os dados são válidos
		if (!data) {
			return { error: "Dados do turno não fornecidos" };
		}

		console.log("Dados recebidos:", JSON.stringify(data, null, 2));

		// Tratar a data especificamente para o formato "$D..."
		let shiftDate: Date;
		if (typeof data.date === "string" && data.date.startsWith("$D")) {
			// Extrair a parte da data após o "$D"
			shiftDate = new Date(data.date.substring(2));
		} else if (data.date instanceof Date) {
			shiftDate = data.date;
		} else {
			shiftDate = new Date(data.date);
		}

		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			return { error: "Usuário não encontrado no banco de dados" };
		}

		// Verificar se o período semanal existe e pertence ao usuário
		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id: data.weeklyPeriodId,
				userId: dbUser.id,
			},
		});

		if (!weeklyPeriod) {
			return { error: "Período semanal não encontrado" };
		}

		// Calcular o total de ganhos
		const totalEarnings = Number(data.uberEarnings) + Number(data.boltEarnings) + Number(data.otherEarnings || 0);

		// Criar o turno
		const shift = await prisma.shift.create({
			data: {
				date: shiftDate,
				uberEarnings: Number(data.uberEarnings),
				boltEarnings: Number(data.boltEarnings),
				otherEarnings: Number(data.otherEarnings || 0),
				totalEarnings,
				initialOdometer: Number(data.initialOdometer),
				finalOdometer: data.finalOdometer ? Number(data.finalOdometer) : null,
				odometer: Number(data.odometer),
				weeklyPeriodId: data.weeklyPeriodId,
				userId: dbUser.id,
				vehicleId: data.vehicleId,
				notes: data.notes || "",
			},
		});

		revalidatePath(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
		return { success: true, shift };
	} catch (error) {
		console.error("Erro ao criar turno:", error);
		return { error: "Falha ao registrar turno" };
	}
}

export async function getShiftById(shiftId: string) {
	try {
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			return { error: "Usuário não encontrado no banco de dados" };
		}

		// Buscar o turno e verificar se pertence ao usuário
		const shift = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				weeklyPeriod: {
					userId: dbUser.id,
				},
			},
			include: {
				vehicle: true, // Incluir informações do veículo
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado" };
		}

		// Buscar o período semanal associado
		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: { id: shift.weeklyPeriodId || "" },
		});

		if (!weeklyPeriod) {
			return { error: "Período semanal não encontrado" };
		}

		return { shift, weeklyPeriod };
	} catch (error) {
		console.error("Erro ao buscar turno:", error);
		return { error: "Falha ao buscar turno" };
	}
}

export async function updateShift(shiftId: string, data: z.infer<typeof shiftSchema>) {
	try {
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			return { error: "Usuário não encontrado no banco de dados" };
		}

		// Verificar se o turno existe e pertence ao usuário
		const shift = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				weeklyPeriod: {
					userId: dbUser.id,
				},
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado" };
		}

		// Verificar se o período semanal existe e pertence ao usuário
		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id: data.weeklyPeriodId,
				userId: dbUser.id,
			},
		});

		if (!weeklyPeriod) {
			return { error: "Período semanal não encontrado" };
		}

		// Calcular o total de ganhos
		const totalEarnings = Number(data.uberEarnings) + Number(data.boltEarnings) + Number(data.otherEarnings || 0);

		// Atualizar o turno
		const updatedShift = await prisma.shift.update({
			where: { id: shiftId },
			data: {
				date: data.date,
				uberEarnings: Number(data.uberEarnings),
				boltEarnings: Number(data.boltEarnings),
				otherEarnings: Number(data.otherEarnings || 0),
				totalEarnings,
				initialOdometer: Number(data.initialOdometer),
				finalOdometer: data.finalOdometer ? Number(data.finalOdometer) : null,
				odometer: Number(data.odometer),
				weeklyPeriodId: data.weeklyPeriodId,
				vehicleId: data.vehicleId,
				notes: data.notes || "",
			},
		});

		revalidatePath(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
		return { success: true, shift: updatedShift };
	} catch (error) {
		console.error("Erro ao atualizar turno:", error);
		return { error: "Falha ao atualizar turno" };
	}
}
