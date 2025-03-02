"use client";

import { deleteVehicle, getUserVehicles, setDefaultVehicle } from "@/actions/vehicle-actions";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddVehicleForm } from "@/components/vehicle/add-vehicle-form";
import { cn } from "@/lib/utils";
import { FuelType, Vehicle } from "@prisma/client";
import { Car, Check, Fuel, PlusIcon, Star, Trash } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function VehiclesPage() {
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);
	const [vehicleShiftCount, setVehicleShiftCount] = useState(0);

	const fetchVehicles = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await getUserVehicles();
			if (result && result.success) {
				setVehicles(result.vehicles || []);
			} else {
				toast.error(result?.error || "Erro ao carregar veículos");
				setVehicles([]);
			}
		} catch (error) {
			toast.error("Erro ao carregar veículos");
			console.error("Erro ao carregar veículos:", error);
			setVehicles([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchVehicles();
	}, [fetchVehicles]);

	async function handleSetDefaultVehicle(id: string) {
		try {
			const result = await setDefaultVehicle(id);
			toast.success("Veículo definido como padrão");
			await fetchVehicles();
		} catch (error) {
			console.error("🔥 Erro na chamada da action:", error);
		}
	}

	function confirmDeleteVehicle(id: string) {
		setVehicleToDelete(id);
		setShowDeleteDialog(true);
	}

	async function handleDeleteVehicle(forceDelete = false) {
		if (!vehicleToDelete) return;

		console.log("handleDeleteVehicle chamado com forceDelete:", forceDelete);
		console.log("vehicleToDelete:", vehicleToDelete);

		try {
			const result = await deleteVehicle(vehicleToDelete, forceDelete);
			console.log("Resultado da exclusão:", result);

			if (result && "error" in result) {
				if (result.hasShifts) {
					console.log("Veículo tem turnos associados, mostrando diálogo de confirmação");
					console.log("Número de turnos:", result.shiftCount);
					setVehicleShiftCount(result.shiftCount || 0);
					setShowForceDeleteDialog(true);
					setShowDeleteDialog(false);
					return;
				}
				toast.error(result.error || "Erro ao excluir veículo");
			} else if (result && "success" in result) {
				toast.success(result.message || "Veículo excluído com sucesso");
				await fetchVehicles();
			} else {
				toast.error("Resposta inválida do servidor");
			}

			setShowDeleteDialog(false);
			setShowForceDeleteDialog(false);
			setVehicleToDelete(null);
		} catch (error) {
			toast.error("Erro ao excluir veículo");
			console.error("Erro ao excluir veículo:", error);

			setShowDeleteDialog(false);
			setShowForceDeleteDialog(false);
			setVehicleToDelete(null);
		}
	}

	function getFuelTypeLabel(fuelType: FuelType) {
		const fuelTypes = {
			GASOLINE: "Gasolina",
			DIESEL: "Diesel",
			ELECTRIC: "Elétrico",
			HYBRID: "Híbrido",
		};
		return fuelTypes[fuelType] || fuelType;
	}

	console.log("Estado atual:", {
		showDeleteDialog,
		showForceDeleteDialog,
		vehicleToDelete,
		vehicleShiftCount,
	});

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Meus Veículos</h1>
				<Button variant="outline" className="gap-2" asChild>
					<Link href="/dashboard/vehicles/new">
						<PlusIcon className="h-4 w-4" />
						<span>Adicionar Veículo</span>
					</Link>
				</Button>
				{/* <AddVehicleForm onSuccess={fetchVehicles} /> */}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Veículos Cadastrados</CardTitle>
					<CardDescription>
						Gerencie seus veículos para registrar seus turnos. O veículo padrão será selecionado automaticamente ao
						criar um novo turno.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
									<div className="space-y-2">
										<Skeleton className="h-5 w-40" />
										<Skeleton className="h-4 w-60" />
									</div>
									<div className="flex items-center space-x-2">
										<Skeleton className="h-9 w-24" />
										<Skeleton className="h-9 w-9" />
									</div>
								</div>
							))}
						</div>
					) : vehicles.length > 0 ? (
						<div className="space-y-4">
							{vehicles.map((vehicle) => (
								<div
									key={vehicle.id}
									className={cn(
										"flex items-center justify-between p-4 border rounded-lg",
										vehicle.isDefault && "border-4 border-zinc-900",
									)}
								>
									<div>
										<div className="flex items-center gap-2">
											<h3 className="font-medium">
												{vehicle.make} {vehicle.model} ({vehicle.year})
											</h3>
											{vehicle.isDefault && (
												<Badge variant="secondary" className="flex items-center gap-1">
													<Star className="h-3 w-3" />
													Padrão
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
											<Fuel className="h-4 w-4" />
											<span>{getFuelTypeLabel(vehicle.fuelType)}</span>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Button
											variant={vehicle.isDefault ? "default" : "outline"}
											size="sm"
											onClick={() => handleSetDefaultVehicle(vehicle.id)}
											disabled={vehicle.isDefault}
										>
											{vehicle.isDefault ? (
												<>
													<Check className="mr-1 h-4 w-4" />
													Padrão
												</>
											) : (
												"Definir como Padrão"
											)}
										</Button>
										<Button
											variant="destructive"
											size="icon"
											onClick={() => confirmDeleteVehicle(vehicle.id)}
											disabled={vehicle.isDefault}
										>
											<Trash className="h-4 w-4" />
										</Button>
										<Button variant="outline" size="sm" asChild>
											<Link href={`/dashboard/vehicles/${vehicle.id}`}>Ver Detalhes</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<Car className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-medium">Nenhum veículo cadastrado</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Adicione seu primeiro veículo para começar a registrar seus turnos.
							</p>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-between">
					<div className="text-sm text-muted-foreground">
						{vehicles.length > 0 ? (
							<>
								Total: {vehicles.length} veículo{vehicles.length > 1 ? "s" : ""}
							</>
						) : null}
					</div>
				</CardFooter>
			</Card>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={() => handleDeleteVehicle()} className="bg-red-600 hover:bg-red-700">
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showForceDeleteDialog} onOpenChange={setShowForceDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Atenção: Veículo em uso</AlertDialogTitle>
						<AlertDialogDescription>
							Este veículo está associado a {vehicleShiftCount} turno(s). Se continuar, esses turnos serão associados ao
							veículo padrão. Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => {
								setShowForceDeleteDialog(false);
								setShowDeleteDialog(false);
								setVehicleToDelete(null);
							}}
						>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction onClick={() => handleDeleteVehicle(true)} className="bg-red-600 hover:bg-red-700">
							Continuar e Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
