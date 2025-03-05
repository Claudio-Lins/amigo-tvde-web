"use client";

import { getShiftFuelConsumption } from "@/actions/fuel-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FuelType } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Fuel, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ShiftFuelRecordsProps {
	shiftId: string;
	vehicleId: string;
}

export function ShiftFuelRecords({ shiftId, vehicleId }: ShiftFuelRecordsProps) {
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadFuelData() {
			try {
				setIsLoading(true);
				const result = await getShiftFuelConsumption(shiftId);
				if (result && !("error" in result)) {
					setData(result);
				} else {
					console.error("Erro ao carregar dados de combustível:", result?.error);
				}
			} catch (error) {
				console.error("Erro ao carregar dados de combustível:", error);
				toast.error("Erro ao carregar dados de combustível");
			} finally {
				setIsLoading(false);
			}
		}

		if (shiftId) {
			loadFuelData();
		}
	}, [shiftId]);

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
	}

	function getFuelUnit(fuelType?: FuelType): string {
		return fuelType === "ELECTRIC" ? "kWh" : "L";
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Fuel className="h-5 w-5" />
						<span>Abastecimentos</span>
					</CardTitle>
					<CardDescription>Carregando dados de combustível...</CardDescription>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						<Fuel className="h-5 w-5" />
						<span>Abastecimentos</span>
					</CardTitle>
					<CardDescription>Registros de abastecimento deste turno</CardDescription>
				</div>
				<Button asChild size="sm" className="gap-1">
					<Link href={`/dashboard/fuel-records/new?shiftId=${shiftId}&vehicleId=${vehicleId}`}>
						<PlusIcon className="h-4 w-4" />
						<span>Adicionar</span>
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				{data && data.fuelRecords && data.fuelRecords.length > 0 ? (
					<>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
							<div className="bg-muted p-4 rounded-lg">
								<div className="text-sm text-muted-foreground">Total Abastecido</div>
								<div className="text-2xl font-bold">
									{data.totalFuel.toFixed(2)} {getFuelUnit(data.shift.vehicle?.fuelType)}
								</div>
							</div>
							<div className="bg-muted p-4 rounded-lg">
								<div className="text-sm text-muted-foreground">Custo Total</div>
								<div className="text-2xl font-bold">{formatCurrency(data.totalCost)}</div>
							</div>
							{data.distance > 0 && (
								<div className="bg-muted p-4 rounded-lg">
									<div className="text-sm text-muted-foreground">Consumo Médio</div>
									<div className="text-2xl font-bold">
										{data.averageConsumption.toFixed(2)} km/{getFuelUnit(data.shift.vehicle?.fuelType)}
									</div>
								</div>
							)}
						</div>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Odômetro</TableHead>
									<TableHead>Quantidade</TableHead>
									<TableHead>Preço</TableHead>
									<TableHead>Total</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.fuelRecords.map((record: any) => (
									<TableRow key={record.id}>
										<TableCell>{format(new Date(record.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
										<TableCell>{record.odometer.toFixed(0)} km</TableCell>
										<TableCell>
											{record.fuelAmount.toFixed(2)} {getFuelUnit(data.shift.vehicle?.fuelType)}
										</TableCell>
										<TableCell>€ {record.pricePerUnit.toFixed(3)}</TableCell>
										<TableCell>€ {record.totalPrice.toFixed(2)}</TableCell>
										<TableCell className="text-right">
											<Button variant="ghost" size="sm" asChild>
												<Link href={`/dashboard/fuel-records/${record.id}/edit`}>Editar</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</>
				) : (
					<div className="text-center py-8">
						<p className="text-muted-foreground mb-4">Nenhum abastecimento registrado para este turno.</p>
						<Button asChild>
							<Link href={`/dashboard/fuel-records/new?shiftId=${shiftId}&vehicleId=${vehicleId}`}>
								<PlusIcon className="mr-2 h-4 w-4" />
								Registrar Abastecimento
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
