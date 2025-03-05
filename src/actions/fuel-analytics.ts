"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { ExpenseCategory, FuelRecord, Shift, Vehicle } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Obtém dados de turno com registros de combustível associados
 */
export async function getShiftWithFuelData(shiftId: string) {
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

		// Buscar o turno com dados de combustível e despesas
		const shiftData = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				userId: dbUser.id,
			},
			include: {
				fuelRecords: true,
				expenses: {
					where: { category: "FUEL" },
				},
				vehicle: true,
				ShiftIncome: true,
				ShiftExpense: true,
			},
		});

		if (!shiftData) {
			return { error: "Turno não encontrado" };
		}

		// Calcular métricas de eficiência
		const distanceTraveled =
			shiftData.finalOdometer && shiftData.initialOdometer ? shiftData.finalOdometer - shiftData.initialOdometer : 0;

		const fuelCost = shiftData.fuelRecords.reduce((total, record) => total + record.totalPrice, 0);

		const totalIncome =
			shiftData.ShiftIncome.reduce((sum, income) => sum + income.amount, 0) +
			shiftData.uberEarnings +
			shiftData.boltEarnings;

		const totalExpenses = shiftData.ShiftExpense.reduce((sum, expense) => sum + expense.amount, 0) + fuelCost;

		const costPerKm = distanceTraveled > 0 ? fuelCost / distanceTraveled : 0;
		const earningsPerKm = distanceTraveled > 0 ? totalIncome / distanceTraveled : 0;
		const profitPerKm = earningsPerKm - costPerKm;

		return {
			success: true,
			shift: shiftData,
			metrics: {
				distanceTraveled,
				fuelCost,
				totalIncome,
				totalExpenses,
				netProfit: totalIncome - totalExpenses,
				costPerKm,
				earningsPerKm,
				profitPerKm,
			},
		};
	} catch (error) {
		console.error("Erro ao buscar dados do turno:", JSON.stringify(error, null, 2));
		return { error: "Falha ao buscar dados do turno" };
	}
}

/**
 * Obtém métricas de eficiência para todos os turnos do usuário
 */
export async function getShiftsEfficiencyReport() {
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

		// Buscar todos os turnos com dados completos
		const shifts = await prisma.shift.findMany({
			where: {
				userId: dbUser.id,
				finalOdometer: { not: null },
				initialOdometer: { not: null },
			},
			include: {
				fuelRecords: true,
				vehicle: true,
				ShiftIncome: true,
				ShiftExpense: true,
			},
			orderBy: { date: "desc" },
		});

		// Calcular métricas para cada turno
		const shiftsWithMetrics = shifts.map((shift) => {
			const distanceTraveled =
				shift.finalOdometer && shift.initialOdometer ? shift.finalOdometer - shift.initialOdometer : 0;
			const fuelCost = shift.fuelRecords.reduce((total, record) => total + record.totalPrice, 0);

			const totalIncome =
				shift.ShiftIncome.reduce((sum, income) => sum + income.amount, 0) + shift.uberEarnings + shift.boltEarnings;

			const totalExpenses = shift.ShiftExpense.reduce((sum, expense) => sum + expense.amount, 0) + fuelCost;

			const costPerKm = distanceTraveled > 0 ? fuelCost / distanceTraveled : 0;
			const earningsPerKm = distanceTraveled > 0 ? totalIncome / distanceTraveled : 0;

			return {
				id: shift.id,
				date: shift.date,
				vehicle: `${shift.vehicle.brand} ${shift.vehicle.model}`,
				distanceTraveled,
				fuelCost,
				totalIncome,
				totalExpenses,
				netProfit: totalIncome - totalExpenses,
				costPerKm,
				earningsPerKm,
				profitPerKm: earningsPerKm - costPerKm,
			};
		});

		return { success: true, shifts: shiftsWithMetrics };
	} catch (error) {
		console.error("Erro ao gerar relatório de eficiência:", JSON.stringify(error, null, 2));
		return { error: "Falha ao gerar relatório de eficiência" };
	}
}

/**
 * Obtém dados de consumo de combustível agrupados por veículo
 */
export async function getFuelConsumptionByVehicle() {
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

		// Buscar todos os veículos do usuário
		const vehicles = await prisma.vehicle.findMany({
			where: {
				userId: dbUser.id,
			},
			include: {
				fuelRecords: {
					orderBy: {
						date: "asc",
					},
					include: {
						shift: true,
					},
				},
			},
		});

		// Processar dados para cada veículo
		const vehicleData = vehicles.map((vehicle) => {
			// Filtrar registros de combustível válidos (com odômetro e quantidade)
			const validRecords = vehicle.fuelRecords.filter((record) => record.odometer && record.fuelAmount);

			// Ordenar por data e odômetro
			const sortedRecords = [...validRecords].sort((a, b) => {
				if (a.date.getTime() === b.date.getTime()) {
					return a.odometer - b.odometer;
				}
				return a.date.getTime() - b.date.getTime();
			});

			// Calcular distância total percorrida
			let totalDistance = 0;
			for (let i = 1; i < sortedRecords.length; i++) {
				const prevRecord = sortedRecords[i - 1];
				const currentRecord = sortedRecords[i];

				// Só calcular distância se o odômetro atual for maior que o anterior
				if (currentRecord.odometer > prevRecord.odometer) {
					totalDistance += currentRecord.odometer - prevRecord.odometer;
				}
			}

			// Calcular consumo total de combustível e custo
			const totalFuel = sortedRecords.reduce((sum, record) => sum + record.fuelAmount, 0);
			const totalCost = sortedRecords.reduce((sum, record) => sum + record.totalPrice, 0);

			// Calcular consumo médio (km/L ou km/kWh)
			const averageConsumption = totalDistance > 0 && totalFuel > 0 ? totalDistance / totalFuel : 0;

			// Calcular custo por km
			const costPerKm = totalDistance > 0 && totalCost > 0 ? totalCost / totalDistance : 0;

			return {
				vehicle: {
					id: vehicle.id,
					brand: vehicle.brand,
					model: vehicle.model,
					fuelType: vehicle.fuelType,
				},
				fuelRecordsCount: sortedRecords.length,
				totalDistance,
				totalFuel,
				totalCost,
				averageConsumption,
				costPerKm,
				// Incluir dados detalhados para possível uso em gráficos
				records: sortedRecords.map((record) => ({
					id: record.id,
					date: record.date,
					odometer: record.odometer,
					fuelAmount: record.fuelAmount,
					totalPrice: record.totalPrice,
					fullTank: record.fullTank,
					shiftId: record.shiftId,
				})),
			};
		});

		return vehicleData;
	} catch (error) {
		console.error("Erro ao obter dados de consumo:", error);
		return { error: "Falha ao obter dados de consumo" };
	}
}

/**
 * Obtém dados de combustível para um período semanal
 */
export async function getWeeklyPeriodFuelData(weeklyPeriodId: string) {
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

		// Buscar o período semanal
		const weeklyPeriod = await prisma.weeklyPeriod.findFirst({
			where: {
				id: weeklyPeriodId,
				userId: dbUser.id,
			},
			include: {
				Shift: {
					include: {
						fuelRecords: true,
						vehicle: true,
					},
				},
			},
		});

		if (!weeklyPeriod) {
			return { error: "Período semanal não encontrado" };
		}

		// Calcular métricas de combustível para o período
		const shiftsWithFuel = weeklyPeriod.Shift.filter((shift) => shift.fuelRecords.length > 0);

		const totalFuelAmount = shiftsWithFuel.reduce(
			(total, shift) => total + shift.fuelRecords.reduce((sum, record) => sum + record.fuelAmount, 0),
			0,
		);

		const totalFuelCost = shiftsWithFuel.reduce(
			(total, shift) => total + shift.fuelRecords.reduce((sum, record) => sum + record.totalPrice, 0),
			0,
		);

		// Calcular distância total percorrida no período
		const shiftsWithOdometer = weeklyPeriod.Shift.filter(
			(shift) => shift.initialOdometer !== null && shift.finalOdometer !== null,
		);

		const totalDistance = shiftsWithOdometer.reduce((total, shift) => {
			if (shift.finalOdometer && shift.initialOdometer) {
				return total + (shift.finalOdometer - shift.initialOdometer);
			}
			return total;
		}, 0);

		// Calcular métricas de eficiência
		const avgConsumption = totalDistance > 0 && totalFuelAmount > 0 ? totalDistance / totalFuelAmount : 0;
		const costPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0;

		// Agrupar dados de combustível por veículo
		const vehicleData = new Map();

		for (const shift of shiftsWithFuel) {
			if (!shift.vehicle) continue;

			const vehicleId = shift.vehicle.id;
			const vehicleName = `${shift.vehicle.brand} ${shift.vehicle.model}`;

			if (!vehicleData.has(vehicleId)) {
				vehicleData.set(vehicleId, {
					id: vehicleId,
					name: vehicleName,
					fuelAmount: 0,
					fuelCost: 0,
					distance: 0,
					shifts: 0,
				});
			}

			const data = vehicleData.get(vehicleId);

			// Adicionar dados de combustível
			const vehicleFuelAmount = shift.fuelRecords.reduce((sum, record) => sum + record.fuelAmount, 0);
			const vehicleFuelCost = shift.fuelRecords.reduce((sum, record) => sum + record.totalPrice, 0);

			// Adicionar distância se disponível
			const shiftDistance =
				shift.initialOdometer && shift.finalOdometer ? shift.finalOdometer - shift.initialOdometer : 0;

			data.fuelAmount += vehicleFuelAmount;
			data.fuelCost += vehicleFuelCost;
			data.distance += shiftDistance;
			data.shifts += 1;

			vehicleData.set(vehicleId, data);
		}

		// Converter Map para array
		const vehicleSummary = Array.from(vehicleData.values()).map((vehicle) => ({
			...vehicle,
			avgConsumption: vehicle.distance > 0 && vehicle.fuelAmount > 0 ? vehicle.distance / vehicle.fuelAmount : 0,
			costPerKm: vehicle.distance > 0 ? vehicle.fuelCost / vehicle.distance : 0,
		}));

		return {
			success: true,
			weeklyPeriod,
			metrics: {
				totalFuelAmount,
				totalFuelCost,
				totalDistance,
				avgConsumption,
				costPerKm,
				shiftsWithFuel: shiftsWithFuel.length,
				totalShifts: weeklyPeriod.Shift.length,
			},
			vehicleSummary,
			shiftsWithFuel,
		};
	} catch (error) {
		console.error("Erro ao buscar dados de combustível do período:", JSON.stringify(error, null, 2));
		return { error: "Falha ao buscar dados de combustível do período" };
	}
}

/**
 * Obtém os dados de consumo de combustível para um turno específico
 */
export async function getShiftFuelConsumption(shiftId: string) {
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

		// Buscar o turno com os registros de combustível associados
		const shift = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				userId: dbUser.id,
			},
			include: {
				vehicle: true,
				fuelRecords: true,
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado" };
		}

		// Calcular o consumo total de combustível para o turno
		const totalFuel = shift.fuelRecords.reduce((sum, record) => sum + record.fuelAmount, 0);

		// Calcular o custo total com combustível
		const totalCost = shift.fuelRecords.reduce((sum, record) => sum + record.totalPrice, 0);

		// Calcular a distância percorrida (se houver odômetro inicial e final)
		let distance = 0;
		if (shift.initialOdometer && shift.finalOdometer) {
			distance = shift.finalOdometer - shift.initialOdometer;
		}

		// Calcular o consumo médio (km/L ou km/kWh)
		const averageConsumption = distance > 0 && totalFuel > 0 ? distance / totalFuel : 0;

		return {
			shift,
			totalFuel,
			totalCost,
			distance,
			averageConsumption,
			fuelRecords: shift.fuelRecords,
		};
	} catch (error) {
		console.error("Erro ao buscar consumo de combustível do turno:", error);
		return { error: "Falha ao buscar dados de consumo" };
	}
}

/**
 * Compara a eficiência de combustível entre vários turnos
 */
export async function getShiftEfficiencyComparison(shiftIds: string[]) {
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

		// Buscar os turnos com os registros de combustível
		const shifts = await prisma.shift.findMany({
			where: {
				id: { in: shiftIds },
				userId: dbUser.id,
			},
			include: {
				vehicle: true,
				fuelRecords: true,
			},
		});

		// Calcular métricas para cada turno
		const shiftMetrics = shifts.map((shift) => {
			const totalFuel = shift.fuelRecords.reduce((sum, record) => sum + record.fuelAmount, 0);

			const totalCost = shift.fuelRecords.reduce((sum, record) => sum + record.totalPrice, 0);

			let distance = 0;
			if (shift.initialOdometer && shift.finalOdometer) {
				distance = shift.finalOdometer - shift.initialOdometer;
			}

			const averageConsumption = distance > 0 && totalFuel > 0 ? distance / totalFuel : 0;
			const costPerKm = distance > 0 ? totalCost / distance : 0;

			return {
				shiftId: shift.id,
				date: shift.date,
				vehicle: shift.vehicle,
				totalFuel,
				totalCost,
				distance,
				averageConsumption,
				costPerKm,
			};
		});

		return shiftMetrics;
	} catch (error) {
		console.error("Erro ao comparar eficiência dos turnos:", error);
		return { error: "Falha ao comparar eficiência" };
	}
}

/**
 * Gera um relatório financeiro detalhado para um turno, incluindo despesas de combustível
 */
export async function getShiftFinancialReport(shiftId: string) {
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

		// Buscar o turno com todas as informações financeiras
		const shift = await prisma.shift.findFirst({
			where: {
				id: shiftId,
				userId: dbUser.id,
			},
			include: {
				vehicle: true,
				ShiftIncome: true,
				ShiftExpense: {
					include: {
						fuelRecord: true,
					},
				},
			},
		});

		if (!shift) {
			return { error: "Turno não encontrado" };
		}

		// Calcular receitas totais
		const totalIncome = shift.ShiftIncome.reduce((sum, income) => sum + income.amount, 0);

		// Separar despesas por categoria
		const expensesByCategory = shift.ShiftExpense.reduce((acc: Record<string, number>, expense) => {
			const category = expense.category;
			if (!acc[category]) {
				acc[category] = 0;
			}
			acc[category] += expense.amount;
			return acc;
		}, {});

		// Calcular despesas totais
		const totalExpenses = shift.ShiftExpense.reduce((sum, expense) => sum + expense.amount, 0);

		// Calcular lucro líquido
		const netProfit = totalIncome - totalExpenses;

		// Calcular despesas de combustível
		const fuelExpenses = shift.ShiftExpense.filter((expense) => expense.category === "FUEL").reduce(
			(sum, expense) => sum + expense.amount,
			0,
		);

		// Calcular porcentagem de despesas de combustível
		const fuelExpensePercentage = totalExpenses > 0 ? (fuelExpenses / totalExpenses) * 100 : 0;

		return {
			shift,
			totalIncome,
			totalExpenses,
			netProfit,
			expensesByCategory,
			fuelExpenses,
			fuelExpensePercentage,
		};
	} catch (error) {
		console.error("Erro ao gerar relatório financeiro do turno:", error);
		return { error: "Falha ao gerar relatório financeiro" };
	}
}

/**
 * Obtém as despesas de um turno agrupadas por categoria
 */
export async function getShiftExpensesByCategory(shiftId: string) {
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

		// Buscar todas as despesas do turno
		const expenses = await prisma.shiftExpense.findMany({
			where: {
				shiftId,
				userId: dbUser.id,
			},
			include: {
				fuelRecord: true,
			},
		});

		// Agrupar por categoria
		const expensesByCategory = expenses.reduce((acc: Record<string, { total: number; items: any[] }>, expense) => {
			const category = expense.category;
			if (!acc[category]) {
				acc[category] = {
					total: 0,
					items: [],
				};
			}
			acc[category].total += expense.amount;
			acc[category].items.push(expense);
			return acc;
		}, {});

		return { expensesByCategory };
	} catch (error) {
		console.error("Erro ao buscar despesas por categoria:", error);
		return { error: "Falha ao buscar despesas por categoria" };
	}
}

export async function getFuelConsumptionByShift() {
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

		// Buscar todos os turnos do usuário com registros de combustível
		const shifts = await prisma.shift.findMany({
			where: {
				userId: dbUser.id,
			},
			include: {
				fuelRecords: {
					include: {
						vehicle: true,
					},
				},
				vehicle: true,
			},
			orderBy: {
				date: "desc",
			},
		});

		// Processar dados para cada turno
		const shiftData = shifts
			.filter((shift) => shift.fuelRecords.length > 0)
			.map((shift) => {
				// Calcular consumo total de combustível e custo para o turno
				const totalFuel = shift.fuelRecords.reduce((sum: number, record) => sum + record.fuelAmount, 0);
				const totalCost = shift.fuelRecords.reduce((sum: number, record) => sum + record.totalPrice, 0);

				// Calcular distância percorrida no turno
				const distance = shift.finalOdometer && shift.initialOdometer ? shift.finalOdometer - shift.initialOdometer : 0;

				// Calcular consumo médio (km/L ou km/kWh)
				const averageConsumption = distance > 0 && totalFuel > 0 ? distance / totalFuel : 0;

				// Calcular custo por km
				const costPerKm = distance > 0 && totalCost > 0 ? totalCost / distance : 0;

				return {
					shift: {
						id: shift.id,
						date: shift.date,
						initialOdometer: shift.initialOdometer,
						finalOdometer: shift.finalOdometer,
					},
					vehicle: {
						id: shift.vehicle.id,
						brand: shift.vehicle.brand,
						model: shift.vehicle.model,
						fuelType: shift.vehicle.fuelType,
					},
					fuelRecordsCount: shift.fuelRecords.length,
					distance,
					totalFuel,
					totalCost,
					averageConsumption,
					costPerKm,
					// Incluir dados detalhados para possível uso em gráficos
					records: shift.fuelRecords.map((record) => ({
						id: record.id,
						date: record.date,
						odometer: record.odometer,
						fuelAmount: record.fuelAmount,
						totalPrice: record.totalPrice,
						fullTank: record.fullTank,
					})),
				};
			});

		return shiftData;
	} catch (error) {
		console.error("Erro ao obter dados de consumo por turno:", error);
		return { error: "Falha ao obter dados de consumo por turno" };
	}
}
