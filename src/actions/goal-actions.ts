"use server";

import { prisma } from "@/lib/prisma";
import { UserGoalFormData } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";

export async function saveUserGoal(data: UserGoalFormData) {
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

		// Verifica se o usuário já tem um objetivo cadastrado
		const existingGoal = await prisma.userGoal.findFirst({
			where: { userId: dbUser.id },
		});

		if (existingGoal) {
			// Atualiza o objetivo existente
			return await prisma.userGoal.update({
				where: { id: existingGoal.id },
				data: {
					weeklyNetIncome: data.weeklyNetIncome,
					monthlyNetIncome: data.monthlyNetIncome,
					workDaysPerWeek: data.workDaysPerWeek,
					workHoursPerDay: data.workHoursPerDay,
				},
			});
		}

		// Cria um novo objetivo (não precisa de "else")
		return await prisma.userGoal.create({
			data: {
				userId: dbUser.id,
				weeklyNetIncome: data.weeklyNetIncome,
				monthlyNetIncome: data.monthlyNetIncome,
				workDaysPerWeek: data.workDaysPerWeek,
				workHoursPerDay: data.workHoursPerDay,
			},
		});
	} catch (error) {
		console.error("Erro ao salvar objetivo:", error);
		throw new Error("Falha ao salvar objetivo financeiro");
	}
}
