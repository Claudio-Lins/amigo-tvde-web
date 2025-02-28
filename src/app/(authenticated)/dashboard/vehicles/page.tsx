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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AddVehicleForm } from "@/components/vehicle/add-vehicle-form";
import { cn } from "@/lib/utils";
import { FuelType, Vehicle } from "@prisma/client";
import { Car, Check, Edit, Fuel, Star, Trash } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function VehiclesPage() {
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const fetchVehicles = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await getUserVehicles();
			setVehicles(result || []);
		} catch (error) {
			toast.error("Erro ao carregar veículos");
			console.error("Erro ao carregar veículos:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchVehicles();
	}, [fetchVehicles]);

	// Função para buscar os veículos do usuário

	// Carregar veículos ao montar o componente
	// useEffect(() => {
	// 	fetchVehicles();
	// }, []);

	// Função para definir um veículo como padrão
	async function handleSetDefaultVehicle(id: string) {
		try {
			const result = await setDefaultVehicle(id);
			toast.success("Veículo definido como padrão");
			await fetchVehicles();
		} catch (error) {
			console.error("🔥 Erro na chamada da action:", error);
		}
	}

	// Função para confirmar exclusão de veículo
	function confirmDeleteVehicle(id: string) {
		setVehicleToDelete(id);
		setShowDeleteDialog(true);
	}

	// Função para excluir um veículo
	async function handleDeleteVehicle() {
		if (!vehicleToDelete) return;

		try {
			const result = await deleteVehicle(vehicleToDelete);

			if (!result || "error" in result) {
				toast.error(typeof result?.error === "string" ? result.error : "Erro ao excluir veículo");
			} else {
				toast.success("Veículo excluído com sucesso");
				await fetchVehicles();
			}
		} catch (error) {
			toast.error("Erro ao excluir veículo");
			console.error("Erro ao excluir veículo:", error);
		} finally {
			setShowDeleteDialog(false);
			setVehicleToDelete(null);
		}
	}

	// Função para traduzir o tipo de combustível
	function getFuelTypeLabel(fuelType: FuelType) {
		const fuelTypes = {
			GASOLINE: "Gasolina",
			DIESEL: "Diesel",
			ELECTRIC: "Elétrico",
			HYBRID: "Híbrido",
		};
		return fuelTypes[fuelType] || fuelType;
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Meus Veículos</h1>
				<AddVehicleForm onSuccess={fetchVehicles} />
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

			{/* Diálogo de confirmação de exclusão */}
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
						<AlertDialogAction onClick={handleDeleteVehicle} className="bg-red-600 hover:bg-red-700">
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
