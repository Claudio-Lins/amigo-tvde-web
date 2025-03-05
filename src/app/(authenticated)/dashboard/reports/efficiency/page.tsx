"use client";

import { getShiftsEfficiencyReport } from "@/actions/fuel-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Fuel, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

export default function EfficiencyReportPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<any>(null);

	useEffect(() => {
		async function loadData() {
			try {
				setIsLoading(true);
				const result = await getShiftsEfficiencyReport();

				if (result.success) {
					setData(result.shifts);
				} else {
					toast.error(result.error || "Erro ao carregar relatório de eficiência");
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", JSON.stringify(error, null, 2));
				toast.error("Erro ao carregar relatório de eficiência");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, []);

	function exportToCSV() {
		if (!data || data.length === 0) return;

		const headers = [
			"Data",
			"Veículo",
			"Distância (km)",
			"Custo Combustível (€)",
			"Receita Total (€)",
			"Despesas Totais (€)",
			"Lucro Líquido (€)",
			"Custo/km (€)",
			"Receita/km (€)",
			"Lucro/km (€)",
		];

		const csvRows = [
			headers.join(","),
			...data.map((row: any) =>
				[
					format(new Date(row.date), "dd/MM/yyyy"),
					`"${row.vehicle}"`,
					row.distanceTraveled.toFixed(1),
					row.fuelCost.toFixed(2),
					row.totalIncome.toFixed(2),
					row.totalExpenses.toFixed(2),
					row.netProfit.toFixed(2),
					row.costPerKm.toFixed(2),
					row.earningsPerKm.toFixed(2),
					row.profitPerKm.toFixed(2),
				].join(","),
			),
		];

		const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `relatorio-eficiencia-${format(new Date(), "yyyy-MM-dd")}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	if (isLoading) {
		return (
			<div className="container py-10">
				<h1 className="text-2xl font-bold mb-6">Relatório de Eficiência</h1>
				<Card>
					<CardHeader>
						<CardTitle>Carregando dados...</CardTitle>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="container py-10">
				<h1 className="text-2xl font-bold mb-6">Relatório de Eficiência</h1>
				<Card>
					<CardHeader>
						<CardTitle>Sem dados disponíveis</CardTitle>
						<CardDescription>Não há turnos com dados completos para gerar o relatório de eficiência.</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	// Preparar dados para o gráfico
	const chartData = data
		.slice(0, 10)
		.map((shift: any) => ({
			name: format(new Date(shift.date), "dd/MM"),
			"Custo/km": parseFloat(shift.costPerKm.toFixed(2)),
			"Lucro/km": parseFloat(shift.profitPerKm.toFixed(2)),
		}))
		.reverse();

	return (
		<div className="container py-10">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Relatório de Eficiência</h1>
				<Button onClick={exportToCSV} variant="outline" size="sm">
					<Download className="h-4 w-4 mr-2" />
					Exportar CSV
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Média de Custo/km</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{(data.reduce((sum: number, shift: any) => sum + shift.costPerKm, 0) / data.length).toFixed(2)} €/km
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Média de Receita/km</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{(data.reduce((sum: number, shift: any) => sum + shift.earningsPerKm, 0) / data.length).toFixed(2)} €/km
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Média de Lucro/km</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{(data.reduce((sum: number, shift: any) => sum + shift.profitPerKm, 0) / data.length).toFixed(2)} €/km
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center">
						<TrendingUp className="mr-2 h-5 w-5" />
						Evolução de Eficiência (Últimos 10 Turnos)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip formatter={(value) => `${value} €/km`} />
								<Legend />
								<Bar dataKey="Custo/km" fill="#ef4444" />
								<Bar dataKey="Lucro/km" fill="#22c55e" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Fuel className="mr-2 h-5 w-5" />
						Detalhes por Turno
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b">
									<th className="text-left py-2">Data</th>
									<th className="text-left py-2">Veículo</th>
									<th className="text-left py-2">Distância</th>
									<th className="text-left py-2">Custo Combustível</th>
									<th className="text-left py-2">Custo/km</th>
									<th className="text-left py-2">Receita/km</th>
									<th className="text-left py-2">Lucro/km</th>
								</tr>
							</thead>
							<tbody>
								{data.map((shift: any) => (
									<tr key={shift.id} className="border-b">
										<td className="py-2">{format(new Date(shift.date), "dd/MM/yyyy")}</td>
										<td className="py-2">{shift.vehicle}</td>
										<td className="py-2">{shift.distanceTraveled.toFixed(1)} km</td>
										<td className="py-2">{shift.fuelCost.toFixed(2)} €</td>
										<td className="py-2">{shift.costPerKm.toFixed(2)} €/km</td>
										<td className="py-2">{shift.earningsPerKm.toFixed(2)} €/km</td>
										<td className="py-2">{shift.profitPerKm.toFixed(2)} €/km</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
