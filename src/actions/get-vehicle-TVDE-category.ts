"use server";

import { prisma } from "@/lib/prisma";

export async function getVehicleTVDECategory() {
	try {
		const categories = await prisma.vehicleTVDECategory.findMany();
		return categories;
	} catch (error) {
		console.error("Erro ao obter categorias de TVDE:", JSON.stringify(error, null, 2));
		throw new Error("Falha ao obter categorias de TVDE");
	}
}
