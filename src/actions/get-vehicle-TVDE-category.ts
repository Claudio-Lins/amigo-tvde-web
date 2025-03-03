"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getVehicleTVDECategory() {
	const { userId } = await auth();

	if (!userId) {
		throw new Error("Usuário não autenticado");
	}
	try {
		const categories = await prisma.vehicle.findMany({
			where: {
				userId: userId,
			},
		});
		return categories;
	} catch (error) {
		console.error("Erro ao obter categorias de TVDE:", JSON.stringify(error, null, 2));
		throw new Error("Falha ao obter categorias de TVDE");
	}
}
