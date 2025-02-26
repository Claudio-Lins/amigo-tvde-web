"use server";

import { prisma } from "@/lib/prisma";
import { VehicleFormData } from "@/schemas";
import { currentUser } from "@clerk/nextjs/server";
import type { FuelType } from "@prisma/client";

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
