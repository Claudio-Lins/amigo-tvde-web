import { prisma } from "@/lib/prisma";

interface AddFuelRecordParams {
	date: Date;
	odometer: number | string;
	fuelAmount: number | string;
	pricePerUnit: number | string;
	totalPrice: number | string;
	fullTank?: boolean;
	notes?: string;
	userId: string;
	vehicleId: string;
}

/**
 * Adiciona um registro de combustível e o associa ao período semanal correspondente
 * Também cria uma despesa automaticamente na categoria FUEL
 */
export async function addFuelRecord({
	date,
	odometer,
	fuelAmount,
	pricePerUnit,
	totalPrice,
	fullTank = true,
	notes,
	userId,
	vehicleId,
}: AddFuelRecordParams) {
	try {
		// Converter valores para número se forem strings
		const odometerValue = typeof odometer === "string" ? Number.parseFloat(odometer) : odometer;
		const fuelAmountValue = typeof fuelAmount === "string" ? Number.parseFloat(fuelAmount) : fuelAmount;
		const pricePerUnitValue = typeof pricePerUnit === "string" ? Number.parseFloat(pricePerUnit) : pricePerUnit;
		const totalPriceValue = typeof totalPrice === "string" ? Number.parseFloat(totalPrice) : totalPrice;

		// Encontrar o período semanal que contém a data fornecida
		const targetWeek = await findWeekForDate(date, userId);

		if (!targetWeek) {
			throw new Error("Não foi encontrado nenhum período semanal que inclua a data selecionada");
		}

		// Criar o registro de combustível
		const fuelRecord = await prisma.fuelRecord.create({
			data: {
				date,
				odometer: odometerValue,
				fuelAmount: fuelAmountValue,
				pricePerUnit: pricePerUnitValue,
				totalPrice: totalPriceValue,
				fullTank,
				notes,
				userId,
				vehicleId,
				weeklyPeriodId: targetWeek.id,
			},
		});

		// Criar também uma despesa correspondente
		await prisma.expense.create({
			data: {
				date,
				amount: totalPriceValue,
				category: "FUEL",
				notes: notes || "Abastecimento",
				userId,
				weeklyPeriodId: targetWeek.id,
			},
		});

		return fuelRecord;
	} catch (error) {
		console.error("Erro ao adicionar registro de combustível:", JSON.stringify(error, null, 2));
		throw error;
	}
}

/**
 * Encontra o período semanal que contém a data especificada para o motorista
 */
async function findWeekForDate(date: Date, userId: string) {
	const formattedDate = new Date(date);

	// Buscar o período semanal que inclui a data fornecida
	const targetWeek = await prisma.weeklyPeriod.findFirst({
		where: {
			userId,
			startDate: {
				lte: formattedDate, // data de início anterior ou igual à data fornecida
			},
			endDate: {
				gte: formattedDate, // data de fim posterior ou igual à data fornecida
			},
		},
	});

	return targetWeek;
}
