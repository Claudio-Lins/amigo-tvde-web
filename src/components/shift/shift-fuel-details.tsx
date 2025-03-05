import { getShiftWithFuelData } from "@/actions/fuel-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, DollarSign, Fuel, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ShiftFuelDetailsProps {
	shiftId: string;
}

export function ShiftFuelDetails({ shiftId }: ShiftFuelDetailsProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<any>(null);

	useEffect(() => {
		async function loadShiftData() {
			try {
				setIsLoading(true);
				const result = await getShiftWithFuelData(shiftId);

				if (result.success) {
					setData(result);
				} else {
					toast.error(result.error || "Erro ao carregar dados do turno");
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", JSON.stringify(error, null, 2));
				toast.error("Erro ao carregar dados do turno");
			} finally {
				setIsLoading(false);
			}
		}

		loadShiftData();
	}, [shiftId]);

	if (isLoading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Dados de Combustível</CardTitle>
					<CardDescription>Carregando...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (!data || !data.success) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Dados de Combustível</CardTitle>
					<CardDescription>Nenhum dado disponível</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const { shift, metrics } = data;
	const hasFuelRecords = shift.fuelRecords.length > 0;

	return (
		<div className="space-y-6">
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center">
						<Fuel className="mr-2 h-5 w-5" />
						Dados de Combustível e Eficiência
					</CardTitle>
					<CardDescription>Turno de {format(new Date(shift.date), "PPP", { locale: ptBR })}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="p-4">
								<CardTitle className="text-sm font-medium">Distância</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<div className="text-2xl font-bold">{metrics.distanceTraveled.toFixed(1)} km</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="p-4">
								<CardTitle className="text-sm font-medium">Custo Combustível</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<div className="text-2xl font-bold">{metrics.fuelCost.toFixed(2)} €</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="p-4">
								<CardTitle className="text-sm font-medium">Custo por km</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<div className="text-2xl font-bold">{metrics.costPerKm.toFixed(2)} €/km</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="p-4">
								<CardTitle className="text-sm font-medium">Lucro por km</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<div className="text-2xl font-bold">{metrics.profitPerKm.toFixed(2)} €/km</div>
							</CardContent>
						</Card>
					</div>

					{hasFuelRecords ? (
						<div className="mt-6">
							<h3 className="text-lg font-semibold mb-4">Registros de Abastecimento</h3>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse">
									<thead>
										<tr className="border-b">
											<th className="text-left py-2">Data</th>
											<th className="text-left py-2">Odômetro</th>
											<th className="text-left py-2">Quantidade</th>
											<th className="text-left py-2">Preço/L</th>
											<th className="text-left py-2">Total</th>
										</tr>
									</thead>
									<tbody>
										{shift.fuelRecords.map((record: any) => (
											<tr key={record.id} className="border-b">
												<td className="py-2">{format(new Date(record.date), "dd/MM/yyyy")}</td>
												<td className="py-2">{record.odometer} km</td>
												<td className="py-2">{record.fuelAmount.toFixed(2)} L</td>
												<td className="py-2">{record.pricePerUnit.toFixed(3)} €</td>
												<td className="py-2">{record.totalPrice.toFixed(2)} €</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					) : (
						<div className="mt-6 text-center p-4 bg-muted rounded-md">
							<p>Nenhum registro de abastecimento associado a este turno.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
