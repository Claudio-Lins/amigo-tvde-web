"use client";

import { deleteFuelRecord, getFuelRecords } from "@/actions/fuel-actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FuelType } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, PlusIcon, Trash } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

function translateFuelType(fuelType: FuelType): string {
	const types = {
		ELECTRIC: "Elétrico",
		GASOLINE: "Gasolina",
		DIESEL: "Gasóleo",
		HYBRID: "Híbrido",
		GAS: "Gás",
	};
	return types[fuelType] || fuelType;
}

export default function FuelRecordsPage() {
	const [fuelRecords, setFuelRecords] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const fetchFuelRecords = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await getFuelRecords();
			if (result && result.success) {
				setFuelRecords(result.fuelRecords || []);
			} else {
				toast.error(result?.error || "Erro ao carregar registros de combustível");
				setFuelRecords([]);
			}
		} catch (error) {
			toast.error("Erro ao carregar registros de combustível");
			console.error("Erro ao carregar registros de combustível:", error);
			setFuelRecords([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchFuelRecords();
	}, [fetchFuelRecords]);

	function confirmDeleteRecord(id: string) {
		setRecordToDelete(id);
		setShowDeleteDialog(true);
	}

	async function handleDeleteRecord() {
		if (!recordToDelete) return;

		try {
			const result = await deleteFuelRecord(recordToDelete);

			if (result && result.success) {
				toast.success("Registro excluído com sucesso");
				await fetchFuelRecords();
			} else {
				toast.error(result?.error || "Erro ao excluir registro");
			}
		} catch (error) {
			toast.error("Erro ao excluir registro");
			console.error("Erro ao excluir registro:", error);
		} finally {
			setShowDeleteDialog(false);
			setRecordToDelete(null);
		}
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Registros de Combustível</h1>
				<Button variant="outline" className="gap-2" asChild>
					<Link href="/dashboard/fuel-records/new">
						<PlusIcon className="h-4 w-4" />
						<span>Adicionar Registro</span>
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Histórico de Abastecimentos</CardTitle>
					<CardDescription>
						Gerencie seus abastecimentos para acompanhar o consumo e os gastos com combustível.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : fuelRecords.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Veículo</TableHead>
									<TableHead>Quantidade</TableHead>
									<TableHead>Preço</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Odômetro</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{fuelRecords.map((record) => (
									<TableRow key={record.id}>
										<TableCell>{format(new Date(record.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span>
													{record.vehicle.make} {record.vehicle.model}
												</span>
												<Badge variant="outline" className="w-fit">
													{translateFuelType(record.vehicle.fuelType)}
												</Badge>
											</div>
										</TableCell>
										<TableCell>
											{record.amount.toFixed(2)} {record.vehicle.fuelType === "ELECTRIC" ? "kWh" : "L"}
										</TableCell>
										<TableCell>
											{formatCurrency(record.price)}/{record.vehicle.fuelType === "ELECTRIC" ? "kWh" : "L"}
										</TableCell>
										<TableCell>{formatCurrency(record.totalCost)}</TableCell>
										<TableCell>{record.odometer.toFixed(1)} km</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button variant="ghost" size="icon" asChild>
													<Link href={`/dashboard/fuel-records/${record.id}/edit`}>
														<Edit className="h-4 w-4" />
													</Link>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-red-500"
													onClick={() => confirmDeleteRecord(record.id)}
												>
													<Trash className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<p className="text-muted-foreground mb-4">Você ainda não tem registros de combustível.</p>
							<Button asChild>
								<Link href="/dashboard/fuel-records/new">
									<PlusIcon className="mr-2 h-4 w-4" />
									Adicionar Primeiro Registro
								</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir Registro</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir este registro de combustível? Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteRecord} className="bg-red-600 hover:bg-red-700">
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
