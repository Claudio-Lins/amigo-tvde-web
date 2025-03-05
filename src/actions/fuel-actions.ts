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
	shiftId: string;
}

export async function createFuelRecord(data: FuelRecordData) {
	console.log("Dados recebidos na função createFuelRecord:", JSON.stringify(data, null, 2));
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

		// Verificar se o turno existe e pertence ao usuário
		const shift = await prisma.shift.findFirst({
			where: {
				id: data.shiftId,
				userId: dbUser.id,
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado ou não pertence ao usuário" };
		}

		// Calcular o custo total se não fornecido
		const totalCost = data.totalCost || data.amount * data.price;

		// Criar a despesa do turno primeiro
		const shiftExpense = await prisma.shiftExpense.create({
			data: {
				shift: {
					connect: {
						id: data.shiftId,
					},
				},
				category: ExpenseCategory.FUEL,
				description: `Abastecimento - ${data.amount.toFixed(2)}L a ${data.price.toFixed(3)}€/L`,
				amount: totalCost,
				user: {
					connect: {
						id: dbUser.id,
					},
				},
			},
		});

		// Criar o registro de combustível associado à despesa
		const fuelRecord = await prisma.fuelRecord.create({
			data: {
				date: data.date,
				odometer: data.odometer,
				fuelAmount: data.amount || 0,
				pricePerUnit: data.price || 0,
				totalPrice: totalCost,
				fullTank: data.fullTank,
				notes: data.notes || "",
				vehicle: {
					connect: {
						id: data.vehicleId,
					},
				},
				user: {
					connect: {
						id: dbUser.id,
					},
				},
				chargingMethod: data.chargingMethod,
				shift: {
					connect: {
						id: data.shiftId,
					},
				},
				shiftExpense: {
					connect: {
						id: shiftExpense.id,
					},
				},
			},
		});

		revalidatePath("/dashboard/fuel-records");
		revalidatePath("/dashboard/consumption");
		revalidatePath(`/dashboard/shifts/${data.shiftId}`);

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
			include: {
				shiftExpense: true,
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

		// Verificar se o turno existe e pertence ao usuário
		const shift = await prisma.shift.findFirst({
			where: {
				id: data.shiftId,
				userId: dbUser.id,
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado" };
		}

		// Calcular o custo total se não fornecido
		const totalCost = data.totalCost || data.amount * data.price;

		// Atualizar a despesa do turno se existir
		if (existingRecord.shiftExpense) {
			await prisma.shiftExpense.update({
				where: { id: existingRecord.shiftExpense.id },
				data: {
					shift: {
						connect: {
							id: data.shiftId,
						},
					},
					amount: totalCost,
					description: `Abastecimento - ${data.amount.toFixed(2)}L a ${data.price.toFixed(3)}€/L`,
				},
			});
		} else {
			// Criar uma nova despesa se não existir
			const shiftExpense = await prisma.shiftExpense.create({
				data: {
					shift: {
						connect: {
							id: data.shiftId,
						},
					},
					category: ExpenseCategory.FUEL,
					description: `Abastecimento - ${data.amount.toFixed(2)}L a ${data.price.toFixed(3)}€/L`,
					amount: totalCost,
					user: {
						connect: {
							id: dbUser.id,
						},
					},
				},
			});

			// Atualizar o registro com a nova despesa
			await prisma.fuelRecord.update({
				where: { id },
				data: {
					shiftExpense: {
						connect: {
							id: shiftExpense.id,
						},
					},
				},
			});
		}

		// Atualizar o registro
		const updatedRecord = await prisma.fuelRecord.update({
			where: { id },
			data: {
				date: data.date,
				fuelAmount: data.amount,
				pricePerUnit: data.price,
				totalPrice: totalCost,
				odometer: data.odometer,
				fullTank: data.fullTank,
				notes: data.notes,
				vehicle: {
					connect: {
						id: data.vehicleId,
					},
				},
				shift: {
					connect: {
						id: data.shiftId,
					},
				},
			},
		});

		revalidatePath("/dashboard/consumption");
		revalidatePath("/dashboard/fuel-records");
		revalidatePath(`/dashboard/fuel-records/${id}/edit`);
		revalidatePath(`/dashboard/shifts/${data.shiftId}`);
		if (existingRecord.shiftId && existingRecord.shiftId !== data.shiftId) {
			revalidatePath(`/dashboard/shifts/${existingRecord.shiftId}`);
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
			include: {
				shiftExpense: true,
			},
		});

		if (!fuelRecord) {
			return { error: "Registro de combustível não encontrado" };
		}

		// Excluir a despesa do turno associada, se existir
		if (fuelRecord.shiftExpense) {
			await prisma.shiftExpense.delete({
				where: { id: fuelRecord.shiftExpense.id },
			});
		}

		// Excluir o registro
		await prisma.fuelRecord.delete({
			where: { id },
		});

		revalidatePath("/dashboard/consumption");
		revalidatePath("/dashboard/fuel-records");
		if (fuelRecord.shiftId) {
			revalidatePath(`/dashboard/shifts/${fuelRecord.shiftId}`);
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
