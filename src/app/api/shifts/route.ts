import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		// Extrair os dados do FormData
		const date = new Date(formData.get("date") as string);
		const uberEarnings = Number(formData.get("uberEarnings"));
		const boltEarnings = Number(formData.get("boltEarnings"));
		const otherEarnings = Number(formData.get("otherEarnings") || 0);
		const initialOdometer = Number(formData.get("initialOdometer"));

		// Tratar finalOdometer com mais cuidado
		let finalOdometer = null;
		if (formData.has("finalOdometer") && formData.get("finalOdometer") !== "") {
			finalOdometer = Number(formData.get("finalOdometer"));
		}

		const odometer = Number(formData.get("odometer"));
		const vehicleId = formData.get("vehicleId") as string;
		const notes = (formData.get("notes") as string) || "";
		const weeklyPeriodId = formData.get("weeklyPeriodId") as string;

		// Verificar se todos os campos obrigatórios estão presentes
		if (
			!date ||
			Number.isNaN(uberEarnings) ||
			Number.isNaN(boltEarnings) ||
			Number.isNaN(initialOdometer) ||
			Number.isNaN(odometer) ||
			!vehicleId ||
			!weeklyPeriodId
		) {
			return NextResponse.json({ message: "Dados inválidos ou incompletos" }, { status: 400 });
		}

		// Verificar autenticação
		const clerkUser = await currentUser();
		if (!clerkUser) {
			return NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 });
		}

		// Buscar usuário no banco de dados
		const dbUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id },
		});

		if (!dbUser) {
			return NextResponse.json({ message: "Usuário não encontrado no banco de dados" }, { status: 404 });
		}

		// Verificar se o período semanal existe e pertence ao usuário
		const weeklyPeriod = await prisma.weeklyPeriod.findUnique({
			where: {
				id: weeklyPeriodId,
				userId: dbUser.id,
			},
		});

		if (!weeklyPeriod) {
			return NextResponse.json({ message: "Período semanal não encontrado" }, { status: 404 });
		}

		// Calcular o total de ganhos
		const totalEarnings = uberEarnings + boltEarnings + otherEarnings;

		// Adicionar log para depuração
		console.log("Dados recebidos na API:", {
			date,
			uberEarnings,
			boltEarnings,
			otherEarnings,
			initialOdometer,
			finalOdometer,
			odometer,
			vehicleId,
			notes,
			weeklyPeriodId,
		});

		// Criar o turno
		const shift = await prisma.shift.create({
			data: {
				date,
				uberEarnings,
				boltEarnings,
				otherEarnings,
				totalEarnings,
				initialOdometer,
				finalOdometer,
				odometer,
				weeklyPeriodId,
				userId: dbUser.id,
				vehicleId,
				notes,
			},
		});

		revalidatePath(`/dashboard/weekly-periods/${weeklyPeriodId}`);

		return NextResponse.json({ success: true, shift }, { status: 201 });
	} catch (error) {
		console.log("Erro ao criar turno:", typeof error, error instanceof Error ? error.message : String(error));

		return NextResponse.json(
			{
				message: "Falha ao registrar turno",
				errorDetails: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
