import { FuelType } from "@prisma/client";

// Função para calcular o consumo médio (L/100km ou kWh/100km)
export function calculateAverageConsumption(fuelRecords: any[]): number {
	if (fuelRecords.length < 2) return 0;

	// Ordenar registros por odômetro
	const sortedRecords = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);

	// Calcular consumo apenas entre abastecimentos completos
	const consumptions: number[] = [];

	for (let i = 1; i < sortedRecords.length; i++) {
		if (sortedRecords[i].fullTank && sortedRecords[i - 1].fullTank) {
			const distance = sortedRecords[i].odometer - sortedRecords[i - 1].odometer;
			if (distance > 0) {
				const consumption = (sortedRecords[i - 1].amount / distance) * 100;
				consumptions.push(consumption);
			}
		}
	}

	// Retornar a média dos consumos calculados
	return consumptions.length > 0 ? consumptions.reduce((sum, val) => sum + val, 0) / consumptions.length : 0;
}

// Função para calcular custo por quilômetro
export function calculateCostPerKm(fuelRecords: any[]): number {
	const avgConsumption = calculateAverageConsumption(fuelRecords);
	if (avgConsumption === 0) return 0;

	// Calcular preço médio por unidade (L ou kWh)
	const totalAmount = fuelRecords.reduce((sum, record) => sum + record.amount, 0);
	const totalCost = fuelRecords.reduce((sum, record) => sum + record.totalCost, 0);

	const avgPrice = totalAmount > 0 ? totalCost / totalAmount : 0;

	// Custo por 100km
	const costPer100km = avgConsumption * avgPrice;

	// Custo por km
	return costPer100km / 100;
}

// Função para calcular a autonomia estimada
export function calculateEstimatedRange(fuelRecords: any[], fuelCapacity = 0): number {
	const avgConsumption = calculateAverageConsumption(fuelRecords);
	if (avgConsumption === 0 || fuelCapacity === 0) return 0;

	// Autonomia = capacidade do tanque / consumo por km
	return (fuelCapacity / avgConsumption) * 100;
}

// Função para obter a unidade de consumo com base no tipo de combustível
export function getConsumptionUnit(fuelType: FuelType): string {
	return fuelType === FuelType.ELECTRIC ? "kWh/100km" : "L/100km";
}

// Função para obter a unidade de preço com base no tipo de combustível
export function getPriceUnit(fuelType: FuelType): string {
	return fuelType === FuelType.ELECTRIC ? "kWh" : "L";
}

// Função para calcular a tendência de consumo (comparando últimos registros)
export function calculateConsumptionTrend(fuelRecords: any[], compareCount = 3): number {
	if (fuelRecords.length < compareCount * 2) return 0;

	const consumptions: number[] = [];
	const sortedRecords = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);

	for (let i = 1; i < sortedRecords.length; i++) {
		if (sortedRecords[i].fullTank && sortedRecords[i - 1].fullTank) {
			const distance = sortedRecords[i].odometer - sortedRecords[i - 1].odometer;
			if (distance > 0) {
				const consumption = (sortedRecords[i - 1].amount / distance) * 100;
				consumptions.push(consumption);
			}
		}
	}

	if (consumptions.length < compareCount * 2) return 0;

	const recentConsumptions = consumptions.slice(-compareCount);
	const previousConsumptions = consumptions.slice(-compareCount * 2, -compareCount);

	const recentAvg = recentConsumptions.reduce((sum, val) => sum + val, 0) / recentConsumptions.length;
	const previousAvg = previousConsumptions.reduce((sum, val) => sum + val, 0) / previousConsumptions.length;

	if (previousAvg === 0) return 0;

	// Retorna a variação percentual
	return ((recentAvg - previousAvg) / previousAvg) * 100;
}
