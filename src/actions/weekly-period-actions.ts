"use server";

import { prisma } from "@/lib/prisma";
import { WeeklyPeriodFormData, weeklyPeriodSchema } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createWeeklyPeriod(data: z.infer<typeof weeklyPeriodSchema> & { vehicleId?: string }) {
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

		// Verificar se já existe um período com datas sobrepostas
		const overlappingPeriod = await prisma.weeklyPeriod.findFirst({
			where: {
				userId: dbUser.id,
				OR: [
					// Período existente que contém a data de início do novo período
					{
						startDate: { lte: data.startDate },
						endDate: { gte: data.startDate },
					},
					// Período existente que contém a data de término do novo período
					{
						startDate: { lte: data.endDate },
						endDate: { gte: data.endDate },
					},
					// Período existente que está contido no novo período
					{
						startDate: { gte: data.startDate },
						endDate: { lte: data.endDate },
					},
				],
			},
		});

		if (overlappingPeriod) {
			return {
				error:
					"Já existe um período que se sobrepõe às datas selecionadas. Por favor, escolha outro intervalo de datas.",
			};
		}

		// Se o novo período será ativo, desativar todos os outros períodos
		if (data.isActive) {
			await prisma.weeklyPeriod.updateMany({
				where: {
					userId: dbUser.id,
					isActive: true,
				},
				data: { isActive: false },
			});
		}

		// Criar o novo período
		const weeklyPeriod = await prisma.weeklyPeriod.create({
			data: {
				name: data.name,
				startDate: data.startDate,
				endDate: data.endDate,
				weeklyGoal: data.weeklyGoal || 0,
				isActive: data.isActive,
				userId: dbUser.id,
			},
		});

		// Se um veículo foi selecionado e é alugado, adicionar a despesa de aluguel
		if (data.vehicleId) {
			const vehicle = await prisma.vehicle.findUnique({
				where: { id: data.vehicleId },
			});

			if (vehicle && vehicle.ownership === "RENTED" && vehicle.weeklyRent) {
				// Adicionar despesa de aluguel
				await prisma.expense.create({
					data: {
						date: data.startDate,
						amount: vehicle.weeklyRent,
						category: "RENT", // Adicionar esta categoria ao enum ExpenseCategory
						notes: `Aluguel semanal do veículo ${vehicle.make} ${vehicle.model}`,
						userId: dbUser.id,
						weeklyPeriodId: weeklyPeriod.id,
					},
				});
			}
		}

		revalidatePath("/dashboard/weekly-periods");
		return { success: true, weeklyPeriod };
	} catch (error) {
		console.error("Erro ao criar período semanal:", error);
		return { error: "Falha ao criar período semanal" };
	}
}

// Função para obter o número da semana do ano
function getWeekNumber(date: Date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
	const week1 = new Date(d.getFullYear(), 0, 4);
	return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export async function getWeeklyPeriods() {
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

		const weeklyPeriods = await prisma.weeklyPeriod.findMany({
			where: { userId: dbUser.id },
			include: {
				Shift: true,
				Expense: true,
			},
			orderBy: { startDate: "desc" },
		});

		return weeklyPeriods;
	} catch (error) {
		console.error("Erro ao buscar períodos semanais:", error);
		return { error: "Falha ao buscar períodos semanais" };
	}
}

export async function getWeeklyPeriodById(id: string) {
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

		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id,
				userId: dbUser.id, // Garantir que o período pertence ao usuário
			},
			include: {
				Shift: true,
				Expense: true,
			},
		});

		if (!weeklyPeriod) {
			return { error: "Período não encontrado" };
		}

		return weeklyPeriod;
	} catch (error) {
		console.error("Erro ao buscar período semanal:", error);
		return { error: "Falha ao buscar período semanal" };
	}
}

export async function updateWeeklyPeriod(id: string, data: WeeklyPeriodFormData) {
	try {
		const clerkUser = await currentUser();

		if (!clerkUser) {
			throw new Error("Usuário não autenticado");
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			throw new Error("Usuário não encontrado no banco de dados");
		}

		// Verificar se o período pertence ao usuário
		const existingPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!existingPeriod) {
			throw new Error("Período semanal não encontrado ou não pertence ao usuário");
		}

		// Gera o nome automaticamente se não for fornecido
		const name = data.name || `Week-${getWeekNumber(data.startDate)}`;

		const updatedWeeklyPeriod = await prisma.weeklyPeriod.update({
			where: { id },
			data: {
				name,
				startDate: data.startDate,
				endDate: data.endDate,
				isActive: data.isActive,
			},
		});

		// Se este período foi definido como ativo, desative outros períodos
		if (data.isActive) {
			await setActiveWeeklyPeriod(id, dbUser.id);
		}

		return updatedWeeklyPeriod;
	} catch (error) {
		console.error("Erro ao atualizar período semanal:", error);
		throw new Error("Falha ao atualizar período semanal");
	}
}

export async function deleteWeeklyPeriod(id: string) {
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

		// Verificar se o período existe e pertence ao usuário
		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!weeklyPeriod) {
			return { error: "Período não encontrado" };
		}

		// Não permitir excluir um período ativo
		if (weeklyPeriod.isActive) {
			return { error: "Não é possível excluir um período ativo. Desative-o primeiro." };
		}

		// Excluir o período
		await prisma.weeklyPeriod.delete({
			where: { id },
		});

		revalidatePath("/dashboard/weekly-periods");
		return { success: true };
	} catch (error) {
		console.error("Erro ao excluir período semanal:", error);
		return { error: "Falha ao excluir período semanal" };
	}
}

export async function getActiveWeeklyPeriod() {
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

		// Buscar o período semanal ativo
		const activePeriod = await prisma.weeklyPeriod.findFirst({
			where: {
				userId: dbUser.id,
				isActive: true,
			},
		});

		if (!activePeriod) {
			return { error: "Não há período semanal ativo" };
		}

		return activePeriod;
	} catch (error) {
		console.error("Erro ao buscar período semanal ativo:", error);
		return { error: "Falha ao buscar período semanal ativo" };
	}
}

// Função auxiliar para definir um período como ativo e desativar os demais
async function setActiveWeeklyPeriod(activeId: string, userId: string) {
	try {
		// Desativa todos os outros períodos
		await prisma.weeklyPeriod.updateMany({
			where: {
				userId,
				id: { not: activeId },
			},
			data: {
				isActive: false,
			},
		});
	} catch (error) {
		console.error("Erro ao definir período ativo:", error);
		throw new Error("Falha ao definir período ativo");
	}
}

export async function addWeeklyPeriod(data: WeeklyPeriodFormData) {
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

		// Verificar se a data de início é uma segunda-feira
		if (new Date(data.startDate).getDay() !== 1) {
			return { error: "O período deve começar em uma segunda-feira" };
		}

		// Verificar se a data de fim é um domingo
		if (new Date(data.endDate).getDay() !== 0) {
			return { error: "O período deve terminar em um domingo" };
		}

		// Verificar se já existe um período com datas sobrepostas
		const overlappingPeriod = await prisma.weeklyPeriod.findFirst({
			where: {
				userId: dbUser.id,
				OR: [
					// Período existente que contém a data de início do novo período
					{
						startDate: { lte: data.startDate },
						endDate: { gte: data.startDate },
					},
					// Período existente que contém a data de término do novo período
					{
						startDate: { lte: data.endDate },
						endDate: { gte: data.endDate },
					},
					// Período existente que está contido no novo período
					{
						startDate: { gte: data.startDate },
						endDate: { lte: data.endDate },
					},
				],
			},
		});

		if (overlappingPeriod) {
			return {
				error:
					"Já existe um período que se sobrepõe às datas selecionadas. Por favor, escolha outro intervalo de datas.",
			};
		}

		// Gera o nome automaticamente se não for fornecido
		const name = data.name || `Week-${getWeekNumber(data.startDate)}`;

		// Se este período será ativo, desative todos os outros
		if (data.isActive) {
			await prisma.weeklyPeriod.updateMany({
				where: {
					userId: dbUser.id,
					isActive: true,
				},
				data: { isActive: false },
			});
		}

		const weeklyPeriod = await prisma.weeklyPeriod.create({
			data: {
				name: name,
				startDate: data.startDate,
				endDate: data.endDate,
				weeklyGoal: data.weeklyGoal || 0,
				isActive: data.isActive,
				userId: dbUser.id,
			},
		});

		revalidatePath("/dashboard/weekly-periods");
		return { success: true, weeklyPeriod };
	} catch (error) {
		console.error("Erro ao criar período semanal:", error);
		return { error: "Falha ao adicionar período semanal" };
	}
}

export async function getUserWeeklyPeriods() {
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

		const weeklyPeriods = await prisma.weeklyPeriod.findMany({
			where: { userId: dbUser.id },
			orderBy: { startDate: "desc" },
		});

		return weeklyPeriods;
	} catch (error) {
		console.error("Erro ao buscar períodos semanais:", error);
		return { error: "Falha ao buscar períodos semanais" };
	}
}

export async function toggleWeeklyPeriodActive(id: string) {
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

		// Verificar se o período existe e pertence ao usuário
		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!weeklyPeriod) {
			return { error: "Período não encontrado" };
		}

		// Se estamos ativando o período, desative todos os outros primeiro
		if (!weeklyPeriod.isActive) {
			await prisma.weeklyPeriod.updateMany({
				where: {
					userId: dbUser.id,
					isActive: true,
				},
				data: { isActive: false },
			});
		}

		// Atualizar o status do período
		const updatedPeriod = await prisma.weeklyPeriod.update({
			where: { id },
			data: { isActive: !weeklyPeriod.isActive },
		});

		revalidatePath(`/dashboard/weekly-periods/${id}`);
		revalidatePath("/dashboard/weekly-periods");

		return { success: true, weeklyPeriod: updatedPeriod };
	} catch (error) {
		console.error("Erro ao alterar status do período:", error);
		return { error: "Falha ao alterar status do período" };
	}
}

/**
 * Busca os períodos semanais mais recentes
 */
export async function getRecentWeeklyPeriods(limit = 3) {
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

		const periods = await prisma.weeklyPeriod.findMany({
			where: {
				userId: dbUser.id,
				isActive: false, // Apenas períodos não ativos (concluídos)
			},
			orderBy: {
				endDate: "desc", // Ordenar pelo mais recente
			},
			take: limit, // Limitar a quantidade
		});

		return periods;
	} catch (error) {
		console.error("Erro ao buscar períodos recentes:", error);
		return { error: "Falha ao buscar períodos recentes" };
	}
}
