import { createShift } from "@/actions/shift-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();
		console.log("Dados recebidos na API:", data);

		// Verificar se todos os campos necessários estão presentes
		if (!data.date || !data.vehicleId || !data.weeklyPeriodId) {
			return NextResponse.json({ error: "Dados incompletos para criar o turno" }, { status: 400 });
		}

		// Chamar a função de criação de turno
		const result = await createShift(data);

		if (result && "success" in result) {
			return NextResponse.json(result, { status: 201 });
		} else {
			return NextResponse.json(result, { status: 400 });
		}
	} catch (error) {
		console.error("Erro ao processar requisição:", error);
		return NextResponse.json({ error: "Erro ao processar a requisição" }, { status: 500 });
	}
}
