"use client";

import { getShiftFinancialReport } from "@/actions/fuel-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseCategory } from "@prisma/client";
import { BanknoteIcon, BarChart3Icon, Fuel, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Mapeamento de categorias para ícones e nomes
const categoryIcons: Record<string, any> = {
	FUEL: <Fuel className="h-4 w-4" />,
	FOOD: <ShoppingBag className="h-4 w-4" />,
	MAINTENANCE: <BarChart3Icon className="h-4 w-4" />,
	PARKING: <BarChart3Icon className="h-4 w-4" />,
	TOLL: <BarChart3Icon className="h-4 w-4" />,
	RENT: <BarChart3Icon className="h-4 w-4" />,
	OTHER: <BarChart3Icon className="h-4 w-4" />,
};

const categoryNames: Record<string, string> = {
	FUEL: "Combustível",
	FOOD: "Alimentação",
	MAINTENANCE: "Manutenção",
	PARKING: "Estacionamento",
	TOLL: "Pedágio",
	RENT: "Aluguel",
	OTHER: "Outros",
};

interface ShiftFinancialReportProps {
	shiftId: string;
}

export function ShiftFinancialReport({ shiftId }: ShiftFinancialReportProps) {
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadFinancialData() {
			try {
				setIsLoading(true);
				const result = await getShiftFinancialReport(shiftId);
				if (result && !("error" in result)) {
					setData(result);
				} else {
					console.error("Erro ao carregar dados financeiros:", result?.error);
				}
			} catch (error) {
				console.error("Erro ao carregar dados financeiros:", error);
				toast.error("Erro ao carregar dados financeiros");
			} finally {
				setIsLoading(false);
			}
		}

		if (shiftId) {
			loadFinancialData();
		}
	}, [shiftId]);

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BanknoteIcon className="h-5 w-5" />
						<span>Relatório Financeiro</span>
					</CardTitle>
					<CardDescription>Carregando dados financeiros...</CardDescription>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BanknoteIcon className="h-5 w-5" />
					<span>Relatório Financeiro</span>
				</CardTitle>
				<CardDescription>Resumo financeiro deste turno</CardDescription>
			</CardHeader>
			<CardContent>
				{data ? (
					<>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="bg-muted p-4 rounded-lg">
								<div className="text-sm text-muted-foreground">Receita Total</div>
								<div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</div>
							</div>
							<div className="bg-muted p-4 rounded-lg">
								<div className="text-sm text-muted-foreground">Despesas Totais</div>
								<div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses)}</div>
							</div>
							<div className="bg-muted p-4 rounded-lg">
								<div className="text-sm text-muted-foreground">Lucro Líquido</div>
								<div className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
									{formatCurrency(data.netProfit)}
								</div>
							</div>
						</div>

						<h3 className="text-lg font-semibold mb-3">Despesas por Categoria</h3>
						<div className="space-y-3">
							{Object.entries(data.expensesByCategory).map(([category, amount]: [string, any]) => (
								<div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
									<div className="flex items-center gap-2">
										<div className="bg-primary/10 p-2 rounded-full">
											{categoryIcons[category] || <BarChart3Icon className="h-4 w-4" />}
										</div>
										<span>{categoryNames[category] || category}</span>
									</div>
									<div className="font-medium">{formatCurrency(amount)}</div>
								</div>
							))}
						</div>

						{data.fuelExpenses > 0 && (
							<div className="mt-6 p-4 bg-muted/30 rounded-lg border border-muted">
								<h4 className="font-medium flex items-center gap-2 mb-2">
									<Fuel className="h-4 w-4" />
									<span>Análise de Combustível</span>
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<div className="text-sm text-muted-foreground">Gasto com Combustível</div>
										<div className="text-xl font-semibold">{formatCurrency(data.fuelExpenses)}</div>
									</div>
									<div>
										<div className="text-sm text-muted-foreground">% das Despesas</div>
										<div className="text-xl font-semibold">{data.fuelExpensePercentage.toFixed(1)}%</div>
									</div>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8">
						<p className="text-muted-foreground">Nenhum dado financeiro disponível para este turno.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
