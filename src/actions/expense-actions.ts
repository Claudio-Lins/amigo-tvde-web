"use server";

import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createExpense(data: z.infer<typeof expenseSchema>) {
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

		// Verificar se a data está dentro do período semanal
		const expenseDate = new Date(data.date);
		const periodStartDate = new Date(weeklyPeriod.startDate);
		const periodEndDate = new Date(weeklyPeriod.endDate);

		if (expenseDate < periodStartDate || expenseDate > periodEndDate) {
			return { error: "A data da despesa deve estar dentro do período semanal" };
		}

		// Criar a despesa
		const expense = await prisma.expense.create({
			data: {
				date: data.date,
				amount: data.amount,
				category: data.category,
				notes: data.notes,
				userId: dbUser.id,
				weeklyPeriodId: data.weeklyPeriodId,
			},
		});

		revalidatePath(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
		return { success: true, expense };
	} catch (error) {
		console.error("Erro ao criar despesa:", error);
		return { error: "Falha ao registrar despesa" };
	}
}

export async function getExpenseById(expenseId: string) {
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

		// Buscar a despesa e verificar se pertence ao usuário
		const expense = await prisma.expense.findFirst({
			where: {
				id: expenseId,
				userId: dbUser.id,
			},
		});

		if (!expense) {
			return { error: "Despesa não encontrada" };
		}

		// Buscar o período semanal associado
		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: { id: expense.weeklyPeriodId || "" },
		});

		if (!weeklyPeriod) {
			return { error: "Período semanal não encontrado" };
		}

		return { expense, weeklyPeriod };
	} catch (error) {
		console.error("Erro ao buscar despesa:", error);
		return { error: "Falha ao buscar despesa" };
	}
}

export async function updateExpense(expenseId: string, data: z.infer<typeof expenseSchema>) {
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

		// Verificar se a despesa existe e pertence ao usuário
		const expense = await prisma.expense.findFirst({
			where: {
				id: expenseId,
				userId: dbUser.id,
			},
		});

		if (!expense) {
			return { error: "Despesa não encontrada" };
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

		// Verificar se a data está dentro do período semanal
		const expenseDate = new Date(data.date);
		const periodStartDate = new Date(weeklyPeriod.startDate);
		const periodEndDate = new Date(weeklyPeriod.endDate);

		if (expenseDate < periodStartDate || expenseDate > periodEndDate) {
			return { error: "A data da despesa deve estar dentro do período semanal" };
		}

		// Atualizar a despesa
		const updatedExpense = await prisma.expense.update({
			where: { id: expenseId },
			data: {
				date: data.date,
				amount: data.amount,
				category: data.category,
				notes: data.notes,
				weeklyPeriodId: data.weeklyPeriodId,
			},
		});

		revalidatePath(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
		return { success: true, expense: updatedExpense };
	} catch (error) {
		console.error("Erro ao atualizar despesa:", error);
		return { error: "Falha ao atualizar despesa" };
	}
}

export async function deleteExpense(expenseId: string) {
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

		// Verificar se a despesa existe e pertence ao usuário
		const expense = await prisma.expense.findFirst({
			where: {
				id: expenseId,
				userId: dbUser.id,
			},
		});

		if (!expense) {
			return { error: "Despesa não encontrada" };
		}

		// Obter o ID do período semanal para revalidação
		const weeklyPeriodId = expense.weeklyPeriodId;

		// Excluir a despesa
		await prisma.expense.delete({
			where: { id: expenseId },
		});

		revalidatePath(`/dashboard/weekly-periods/${weeklyPeriodId}`);
		return { success: true };
	} catch (error) {
		console.error("Erro ao excluir despesa:", error);
		return { error: "Falha ao excluir despesa" };
	}
}

export async function getUserExpenses() {
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

		const expenses = await prisma.expense.findMany({
			where: { userId: dbUser.id },
			orderBy: { date: "desc" },
		});

		return { success: true, expenses };
	} catch (error) {
		console.error("Erro ao buscar despesas do usuário:", error);
		return { error: "Falha ao buscar despesas" };
	}
}
