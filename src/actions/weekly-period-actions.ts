"use server";

import { prisma } from "@/lib/prisma";
import { WeeklyPeriodFormData } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";

export async function createWeeklyPeriod(data: WeeklyPeriodFormData) {
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

		// Gera o nome automaticamente se não for fornecido
		const name = data.name || `Week-${getWeekNumber(data.startDate)}`;

		const weeklyPeriod = await prisma.weeklyPeriod.create({
			data: {
				userId: dbUser.id,
				name,
				startDate: data.startDate,
				endDate: data.endDate,
				isActive: data.isActive,
			},
		});

		return weeklyPeriod;
	} catch (error) {
		console.error("Erro ao criar período semanal:", error);
		throw new Error("Falha ao criar período semanal");
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
			throw new Error("Usuário não autenticado");
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			throw new Error("Usuário não encontrado no banco de dados");
		}

		const weeklyPeriods = await prisma.weeklyPeriod.findMany({
			where: { userId: dbUser.id },
			orderBy: { startDate: "desc" },
		});

		return weeklyPeriods;
	} catch (error) {
		console.error("Erro ao buscar períodos semanais:", error);
		throw new Error("Falha ao buscar períodos semanais");
	}
}

export async function getWeeklyPeriodById(id: string) {
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

		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!weeklyPeriod) {
			throw new Error("Período semanal não encontrado");
		}

		return weeklyPeriod;
	} catch (error) {
		console.error("Erro ao buscar período semanal:", error);
		throw new Error("Falha ao buscar período semanal");
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

		// Excluir o período
		await prisma.weeklyPeriod.delete({
			where: { id },
		});

		return { success: true };
	} catch (error) {
		console.error("Erro ao excluir período semanal:", error);
		throw new Error("Falha ao excluir período semanal");
	}
}

export async function getActiveWeeklyPeriod() {
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

		const activePeriod = await prisma.weeklyPeriod.findFirst({
			where: {
				userId: dbUser.id,
				isActive: true,
			},
		});

		return activePeriod;
	} catch (error) {
		console.error("Erro ao buscar período semanal ativo:", error);
		throw new Error("Falha ao buscar período semanal ativo");
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
