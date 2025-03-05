"use client";

import { deleteVehicle, getVehicleById, setDefaultVehicle } from "@/actions/vehicle-actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FuelType, VehicleOwnership } from "@prisma/client";
import { ArrowLeft, Car, Edit, Star, Trash } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function VehicleDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const [vehicle, setVehicle] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		async function loadVehicle() {
			try {
				setIsLoading(true);
				const result = await getVehicleById(params.id as string);

				if (result && !("error" in result)) {
					setVehicle(result);
				} else {
					toast.error(result?.error || "Erro ao carregar veículo");
					router.push("/dashboard/vehicles");
				}
			} catch (error) {
				console.error("Erro ao carregar veículo:", error);
				toast.error("Erro ao carregar veículo");
				router.push("/dashboard/vehicles");
			} finally {
				setIsLoading(false);
			}
		}

		loadVehicle();
	}, [params.id, router]);

	async function handleSetDefault() {
		try {
			setIsProcessing(true);
			const result = await setDefaultVehicle(vehicle.id);

			if (result && !("error" in result)) {
				toast.success("Veículo definido como padrão");
				setVehicle({ ...vehicle, isDefault: true });
			} else {
				toast.error(result?.error || "Erro ao definir veículo como padrão");
			}
		} catch (error) {
			console.error("Erro ao definir veículo como padrão:", error);
			toast.error("Erro ao definir veículo como padrão");
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleDelete() {
		try {
			setIsProcessing(true);
			const result = await deleteVehicle(vehicle.id);

			if (result && result.success) {
				toast.success("Veículo excluído com sucesso");
				router.push("/dashboard/vehicles");
			} else {
				toast.error(result?.error || "Erro ao excluir veículo");
			}
		} catch (error) {
			console.error("Erro ao excluir veículo:", error);
			toast.error("Erro ao excluir veículo");
		} finally {
			setIsProcessing(false);
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

	function getOwnershipTypeLabel(ownershipType: VehicleOwnership) {
		const ownershipTypes = {
			OWNED: "Próprio",
			RENTED: "Alugado",
			COMMISSION: "Comissão",
		};
		return ownershipTypes[ownershipType] || ownershipType;
	}

	if (isLoading) {
		return (
			<div className="container py-10">
				<div className="flex items-center gap-4 mb-6">
					<Button variant="outline" size="icon" asChild>
						<Link href="/dashboard/vehicles">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
				</div>
				<div className="h-64 bg-muted animate-pulse rounded" />
			</div>
		);
	}

	if (!vehicle) {
		return (
			<div className="container py-10">
				<div className="flex items-center gap-4 mb-6">
					<Button variant="outline" size="icon" asChild>
						<Link href="/dashboard/vehicles">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<h1 className="text-2xl font-bold">Veículo não encontrado</h1>
				</div>
				<Card>
					<CardContent className="py-10">
						<div className="flex flex-col items-center justify-center text-center">
							<Car className="h-16 w-16 text-muted-foreground mb-4" />
							<h2 className="text-xl font-semibold mb-2">Veículo não encontrado</h2>
							<p className="text-muted-foreground mb-6">
								O veículo que você está procurando não existe ou foi removido.
							</p>
							<Button asChild>
								<Link href="/dashboard/vehicles">Voltar para Veículos</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container py-10">
			<div className="flex items-center gap-4 mb-6">
				<Button variant="outline" size="icon" asChild>
					<Link href="/dashboard/vehicles">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">
					{vehicle.brand} {vehicle.model} ({vehicle.year})
				</h1>
				{vehicle.isDefault && (
					<Badge variant="secondary" className="flex items-center gap-1">
						<Star className="h-3 w-3" />
						Veículo Padrão
					</Badge>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Informações do Veículo</CardTitle>
						<CardDescription>Detalhes do veículo cadastrado</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Marca</h3>
								<p className="text-lg">{vehicle.brand}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Modelo</h3>
								<p className="text-lg">{vehicle.model}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Ano</h3>
								<p className="text-lg">{vehicle.year}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Placa</h3>
								<p className="text-lg">{vehicle.licensePlate || "Não informada"}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Combustível</h3>
								<p className="text-lg">{getFuelTypeLabel(vehicle.fuelType)}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">Tipo de Propriedade</h3>
								<p className="text-lg">{getOwnershipTypeLabel(vehicle.ownership)}</p>
							</div>
							{vehicle.ownership === VehicleOwnership.RENTED && (
								<div>
									<h3 className="text-sm font-medium text-muted-foreground">Valor do Aluguel Semanal</h3>
									<p className="text-lg">€ {vehicle.weeklyRent?.toFixed(2) || "0,00"}</p>
								</div>
							)}
							{vehicle.ownership === VehicleOwnership.COMMISSION && (
								<div>
									<h3 className="text-sm font-medium text-muted-foreground">Porcentagem de Comissão</h3>
									<p className="text-lg">{vehicle.commissionRate?.toFixed(2) || "0,00"}%</p>
								</div>
							)}
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" asChild>
							<Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
								<Edit className="h-4 w-4 mr-2" />
								Editar Veículo
							</Link>
						</Button>
						<div className="flex gap-2">
							{!vehicle.isDefault && (
								<Button onClick={handleSetDefault} disabled={isProcessing}>
									<Star className="h-4 w-4 mr-2" />
									Definir como Padrão
								</Button>
							)}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="destructive" disabled={isProcessing || vehicle.isDefault}>
										<Trash className="h-4 w-4 mr-2" />
										Excluir
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
										<AlertDialogDescription>
											Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
											Excluir
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Estatísticas</CardTitle>
						<CardDescription>Dados de uso deste veículo</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">Status</h3>
							<p className="text-lg">{vehicle.isDefault ? "Veículo Padrão" : "Veículo Secundário"}</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">Data de Cadastro</h3>
							<p className="text-lg">
								{new Date(vehicle.createdAt).toLocaleDateString("pt-BR", {
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
								})}
							</p>
						</div>
						{/* Aqui podemos adicionar mais estatísticas no futuro, como:
						- Número de turnos realizados com este veículo
						- Quilometragem total
						- Ganhos totais
						- etc.
						*/}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
