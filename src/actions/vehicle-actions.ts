"use server";

import { prisma } from "@/lib/prisma";
import { VehicleFormData } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import type { FuelType } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
			make: data.make,
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

export async function deleteVehicle(id: string) {
	try {
		const vehicle = await prisma.vehicle.delete({
			where: { id },
		});

		return vehicle;
	} catch (error) {
		console.error("Erro ao deletar veículo:", error);
		throw new Error(`Falha ao deletar veículo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
	}
}

export async function getUserVehicles() {
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

		const vehicles = await prisma.vehicle.findMany({
			where: { userId: dbUser.id },
		});

		// revalidatePath("/dashboard/vehicles");

		return vehicles;
	} catch (error) {
		console.error("Erro ao buscar veículos do usuário:", error);
		throw new Error(
			`Falha ao buscar veículos do usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		);
	}
}

export async function setDefaultVehicle(id: string) {
	try {
		console.log("🚀 Iniciando setDefaultVehicle com id:", id);

		const clerkUser = await currentUser();
		if (!clerkUser) {
			console.error("❌ Usuário não autenticado");
			return { error: "Usuário não autenticado" };
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			console.error("❌ Usuário não encontrado no banco de dados");
			return { error: "Usuário não encontrado no banco de dados" };
		}

		console.log("🔍 Usuário encontrado:", dbUser);

		// 🔹 Log dos veículos antes da atualização
		const existingVehicles = await prisma.vehicle.findMany({
			where: { userId: dbUser.id },
		});
		console.log("🚗 Veículos encontrados do usuário:", existingVehicles);

		// 🔹 Atualizar todos os veículos para isDefault = false antes
		console.log("🔄 Removendo veículo padrão anterior...");
		const updatedCount = await prisma.vehicle.updateMany({
			where: { userId: dbUser.id, isDefault: true },
			data: { isDefault: false },
		});
		console.log("✅ Veículos antigos atualizados:", updatedCount);

		if (!updatedCount || updatedCount.count === 0) {
			console.warn("⚠ Nenhum veículo foi atualizado para isDefault: false.");
		}

		// 🔹 Atualizar o veículo específico para isDefault = true
		console.log("🌟 Definindo novo veículo padrão:", id);
		const updatedVehicle = await prisma.vehicle.update({
			where: { id },
			data: { isDefault: true },
		});
		console.log("✅ Veículo atualizado com sucesso:", updatedVehicle);

		// 🔹 Certifique-se de sempre retornar um objeto
		return updatedVehicle ?? { error: "Veículo não encontrado após update" };
	} catch (error) {
		console.error("🔥 Erro crítico:", error);
		return { error: `Erro interno: ${error instanceof Error ? error.message : "Erro desconhecido"}` };
	}
}

export async function updateVehicle(id: string, data: VehicleFormData) {
	try {
		const vehicle = await prisma.vehicle.update({
			where: { id },
			data: {
				make: data.make,
				model: data.model,
				year: data.year,
				fuelType: data.fuelType,
			},
		});

		return vehicle;
	} catch (error) {
		console.error("Erro ao atualizar veículo:", error);
		throw new Error(`Falha ao atualizar veículo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
	}
}
