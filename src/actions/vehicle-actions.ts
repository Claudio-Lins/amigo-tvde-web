"use server";

import { prisma } from "@/lib/prisma";
import { VehicleFormData, vehicleSchema } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import type { FuelType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function addVehicle(data: VehicleFormData) {
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

		const vehicleData = {
			brand: data.brand,
			model: data.model,
			year: data.year,
			fuelType: data.fuelType,
			userId: dbUser.id,
		};

		const vehicle = await prisma.vehicle.create({
			data: vehicleData,
		});

		console.log("Veículo criado:", vehicle);

		return vehicle;
	} catch (error) {
		console.error("Erro completo ao criar veículo:", error);
		throw new Error(`Falha ao adicionar veículo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
	}
}

export async function deleteVehicle(id: string, forceDelete = false) {
	try {
		console.log("deleteVehicle chamado com id:", id, "forceDelete:", forceDelete);

		const clerkUser = await currentUser();
		if (!clerkUser) {
			console.log("Usuário não autenticado");
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			console.log("Usuário não encontrado no banco de dados");
			return { error: "Usuário não encontrado no banco de dados" };
		}

		const vehicle = await prisma.vehicle.findUnique({
			where: {
				id,
				userId: dbUser.id,
			},
			include: {
				_count: {
					select: {
						Shift: true,
					},
				},
			},
		});

		console.log("Veículo encontrado:", vehicle);

		if (!vehicle) {
			console.log("Veículo não encontrado");
			return { error: "Veículo não encontrado" };
		}

		if (vehicle.isDefault) {
			console.log("Tentativa de excluir veículo padrão");
			return { error: "Não é possível excluir o veículo padrão" };
		}

		// Verificar se o veículo está associado a turnos
		console.log("Número de turnos associados:", vehicle._count.Shift);

		if (vehicle._count.Shift > 0 && !forceDelete) {
			console.log("Veículo tem turnos e forceDelete=false, retornando hasShifts=true");
			return {
				error: "Este veículo está associado a turnos",
				hasShifts: true,
				shiftCount: vehicle._count.Shift,
			};
		}

		// Se forceDelete for true, primeiro desassociar os turnos
		if (forceDelete && vehicle._count.Shift > 0) {
			console.log("forceDelete=true, buscando veículo padrão para transferir turnos");

			// Encontrar outro veículo para associar os turnos
			const defaultVehicle = await prisma.vehicle.findFirst({
				where: {
					userId: dbUser.id,
					isDefault: true,
					id: { not: id }, // Não selecionar o veículo que está sendo excluído
				},
			});

			console.log("Veículo padrão encontrado:", defaultVehicle);

			if (!defaultVehicle) {
				console.log("Nenhum veículo padrão encontrado");
				return { error: "Não foi possível encontrar um veículo alternativo para os turnos" };
			}

			// Atualizar todos os turnos para usar o veículo padrão
			console.log("Atualizando turnos para usar o veículo padrão");
			const updatedShifts = await prisma.shift.updateMany({
				where: {
					vehicleId: id,
				},
				data: {
					vehicleId: defaultVehicle.id,
				},
			});

			console.log("Turnos atualizados:", updatedShifts);
		}

		// Agora podemos excluir o veículo
		console.log("Excluindo veículo");
		await prisma.vehicle.delete({
			where: { id },
		});

		console.log("Veículo excluído com sucesso");
		revalidatePath("/dashboard/vehicles");
		return { success: true, message: "Veículo excluído com sucesso" };
	} catch (error) {
		console.error("Erro ao excluir veículo:", error);
		return { error: "Falha ao excluir veículo" };
	}
}

export async function getUserVehicles() {
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

		const vehicles = await prisma.vehicle.findMany({
			where: { userId: dbUser.id },
		});

		return { success: true, vehicles };
	} catch (error) {
		console.error("Erro ao buscar veículos do usuário:", error);
		return { error: "Falha ao buscar veículos do usuário" };
	}
}

export async function setDefaultVehicle(id: string) {
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
				id,
				userId: dbUser.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado" };
		}

		// Remover o padrão de todos os veículos
		await prisma.vehicle.updateMany({
			where: {
				userId: dbUser.id,
				isDefault: true,
			},
			data: { isDefault: false },
		});

		// Definir este veículo como padrão
		const updatedVehicle = await prisma.vehicle.update({
			where: { id },
			data: { isDefault: true },
		});

		revalidatePath("/dashboard/vehicles");
		return { success: true, vehicle: updatedVehicle };
	} catch (error) {
		console.error("Erro ao definir veículo padrão:", error);
		return { error: "Falha ao definir veículo padrão" };
	}
}

export async function updateVehicle(id: string, data: z.infer<typeof vehicleSchema>) {
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
		const existingVehicle = await prisma.vehicle.findUnique({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!existingVehicle) {
			return { error: "Veículo não encontrado" };
		}

		// Se este veículo for definido como padrão, remover o padrão de outros veículos
		if (data.isDefault && !existingVehicle.isDefault) {
			await prisma.vehicle.updateMany({
				where: { userId: dbUser.id, isDefault: true },
				data: { isDefault: false },
			});
		}

		// Atualizar o veículo
		const vehicle = await prisma.vehicle.update({
			where: { id },
			data: {
				brand: data.brand,
				model: data.model,
				year: data.year,
				fuelType: data.fuelType,
				isDefault: data.isDefault,
				ownership: data.ownership,
				weeklyRent: data.ownership === "RENTED" ? data.weeklyRent : null,
				commissionRate: data.ownership === "COMMISSION" ? data.commissionRate : null,
				licensePlate: data.licensePlate,
			},
		});

		revalidatePath("/dashboard/vehicles");
		return { success: true, vehicle };
	} catch (error) {
		console.error("Erro ao atualizar veículo:", error);
		return { error: "Falha ao atualizar veículo" };
	}
}

export async function getVehicleById(id: string) {
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

		const vehicle = await prisma.vehicle.findUnique({
			where: {
				id,
				userId: dbUser.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado" };
		}

		return vehicle;
	} catch (error) {
		console.error("Erro ao buscar veículo:", error);
		return { error: "Falha ao buscar veículo" };
	}
}

export async function toggleDefaultVehicle(id: string) {
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
				id,
				userId: dbUser.id,
			},
		});

		if (!vehicle) {
			return { error: "Veículo não encontrado" };
		}

		// Se estamos definindo este veículo como padrão, remova o padrão de todos os outros
		if (!vehicle.isDefault) {
			await prisma.vehicle.updateMany({
				where: {
					userId: dbUser.id,
					isDefault: true,
				},
				data: { isDefault: false },
			});
		}

		// Atualizar o status do veículo
		const updatedVehicle = await prisma.vehicle.update({
			where: { id },
			data: { isDefault: !vehicle.isDefault },
		});

		revalidatePath(`/dashboard/vehicles/${id}`);
		revalidatePath("/dashboard/vehicles");

		return { success: true, vehicle: updatedVehicle };
	} catch (error) {
		console.error("Erro ao alterar veículo padrão:", error);
		return { error: "Falha ao alterar veículo padrão" };
	}
}

export async function getVehicles() {
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

		const vehicles = await prisma.vehicle.findMany({
			where: { userId: dbUser.id },
			orderBy: { isDefault: "desc" },
		});

		return vehicles;
	} catch (error) {
		console.error("Erro ao buscar veículos:", error);
		return { error: "Falha ao buscar veículos" };
	}
}

export async function createVehicle(data: z.infer<typeof vehicleSchema>) {
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

		// Se este veículo for definido como padrão, remover o padrão de outros veículos
		if (data.isDefault) {
			await prisma.vehicle.updateMany({
				where: { userId: dbUser.id, isDefault: true },
				data: { isDefault: false },
			});
		}

		// Criar o veículo
		const vehicle = await prisma.vehicle.create({
			data: {
				brand: data.brand,
				model: data.model,
				year: data.year,
				fuelType: data.fuelType,
				isDefault: data.isDefault,
				ownership: data.ownership,
				weeklyRent: data.ownership === "RENTED" ? data.weeklyRent : null,
				commissionRate: data.ownership === "COMMISSION" ? data.commissionRate : null,
				licensePlate: data.licensePlate,
				userId: dbUser.id,
			},
		});

		revalidatePath("/dashboard/vehicles");
		return { success: true, vehicle };
	} catch (error) {
		console.error("Erro ao criar veículo:", error);
		return { error: "Falha ao adicionar veículo" };
	}
}
