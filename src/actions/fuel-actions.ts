"use server";

import { createExpense } from "@/actions/expense-actions";
import { prisma } from "@/lib/prisma";
import { fuelRecordSchema } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import { ExpenseCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

interface FuelRecordData {
	date: Date;
	odometer: number;
	amount: number;
	price: number;
	totalCost?: number;
	fullTank: boolean;
	notes?: string;
	vehicleId: string;
	chargingMethod?: "volume" | "time";
	location?: string;
	weeklyPeriodId?: string;
}

export async function createFuelRecord(data: FuelRecordData) {
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
		const vehicle = await prisma.vehicle.findFirst({
			where: {
				id: data.vehicleId,
				userId: dbUser.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado ou não pertence ao usuário" };
		}

		// Criar o registro de combustível
		const fuelRecord = await prisma.fuelRecord.create({
			data: {
				date: data.date,
				odometer: data.odometer,
				fuelAmount: data.amount || 0,
				pricePerUnit: data.price || 0,
				totalPrice: data.totalCost || 0,
				fullTank: data.fullTank,
				notes: data.notes || "",
				vehicleId: data.vehicleId,
				userId: dbUser.id,
				chargingMethod: data.chargingMethod,
			},
		});

		revalidatePath("/dashboard/fuel-records");
		revalidatePath("/dashboard/consumption");

		return { success: true, fuelRecord };
	} catch (error) {
		console.error("Erro ao criar registro de combustível:", error);
		return { error: "Falha ao adicionar registro de combustível" };
	}
}

export async function getFuelRecords() {
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

		const fuelRecords = await prisma.fuelRecord.findMany({
			where: {
				userId: dbUser.id,
			},
			include: {
				vehicle: true,
			},
			orderBy: {
				date: "desc",
			},
		});

		return fuelRecords;
	} catch (error) {
		console.error("Erro ao buscar registros de combustível:", error);
		return { error: "Falha ao buscar registros de combustível" };
	}
}

export async function getFuelRecordById(id: string) {
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

		const fuelRecord = await prisma.fuelRecord.findFirst({
			where: {
				id,
				userId: dbUser.id,
			},
			include: {
				vehicle: true,
			},
		});

		if (!fuelRecord) {
			return { error: "Registro de combustível não encontrado" };
		}

		return { success: true, fuelRecord };
	} catch (error) {
		console.error("Erro ao buscar registro de combustível:", error);
		return { error: "Falha ao buscar registro de combustível" };
	}
}

export async function updateFuelRecord(id: string, data: z.infer<typeof fuelRecordSchema>) {
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

		// Verificar se o registro existe e pertence ao usuário
		const existingRecord = await prisma.fuelRecord.findFirst({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!existingRecord) {
			return { error: "Registro de combustível não encontrado" };
		}

		// Verificar se o veículo existe e pertence ao usuário
		const vehicle = await prisma.vehicle.findFirst({
			where: {
				id: data.vehicleId,
				userId: dbUser.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado" };
		}

		// Calcular o custo total se não fornecido
		const totalCost = data.totalCost || data.amount * data.price;

		// Atualizar o registro
		const updatedRecord = await prisma.fuelRecord.update({
			where: { id },
			data: {
				date: data.date,
				fuelAmount: data.amount,
				pricePerUnit: data.price,
				totalPrice: data.totalCost,
				odometer: data.odometer,
				fullTank: data.fullTank,
				notes: data.notes,
				vehicleId: data.vehicleId,
				weeklyPeriodId: data.weeklyPeriodId,
			},
		});

		revalidatePath("/dashboard/consumption");
		revalidatePath("/dashboard/fuel-records");
		revalidatePath(`/dashboard/fuel-records/${id}/edit`);
		if (data.weeklyPeriodId) {
			revalidatePath(`/dashboard/weekly-periods/${data.weeklyPeriodId}`);
		}
		if (existingRecord.weeklyPeriodId && existingRecord.weeklyPeriodId !== data.weeklyPeriodId) {
			revalidatePath(`/dashboard/weekly-periods/${existingRecord.weeklyPeriodId}`);
		}

		return { success: true, fuelRecord: updatedRecord };
	} catch (error) {
		console.error("Erro ao atualizar registro de combustível:", error);
		return { error: "Falha ao atualizar registro de combustível" };
	}
}

export async function deleteFuelRecord(id: string) {
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

		// Verificar se o registro existe e pertence ao usuário
		const fuelRecord = await prisma.fuelRecord.findFirst({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!fuelRecord) {
			return { error: "Registro de combustível não encontrado" };
		}

		// Excluir o registro
		await prisma.fuelRecord.delete({
			where: { id },
		});

		revalidatePath("/dashboard/consumption");
		revalidatePath("/dashboard/fuel-records");
		if (fuelRecord.weeklyPeriodId) {
			revalidatePath(`/dashboard/weekly-periods/${fuelRecord.weeklyPeriodId}`);
		}

		return { success: true };
	} catch (error) {
		console.error("Erro ao excluir registro de combustível:", error);
		return { error: "Falha ao excluir registro de combustível" };
	}
}

export async function getFuelRecordsByVehicle(vehicleId: string) {
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
		const vehicle = await prisma.vehicle.findFirst({
			where: {
				id: vehicleId,
				userId: dbUser.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado" };
		}

		const fuelRecords = await prisma.fuelRecord.findMany({
			where: {
				vehicleId,
				userId: dbUser.id,
			},
			orderBy: {
				date: "asc",
			},
		});

		return { success: true, fuelRecords };
	} catch (error) {
		console.error("Erro ao buscar registros de combustível por veículo:", error);
		return { error: "Falha ao buscar registros de combustível" };
	}
}
