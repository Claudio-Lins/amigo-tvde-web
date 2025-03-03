"use client";

import { getShiftById } from "@/actions/shift-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, Car, Edit, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ShiftDetailsPage() {
	const router = useRouter();
	const params = useParams();
	const shiftId = params.id as string;
	const [isLoading, setIsLoading] = useState(true);
	const [shift, setShift] = useState<any>(null);
	const [weeklyPeriod, setWeeklyPeriod] = useState<any>(null);

	useEffect(() => {
		async function loadData() {
			try {
				const result = await getShiftById(shiftId);

				if (result && !("error" in result)) {
					setShift(result.shift);
					setWeeklyPeriod(result.weeklyPeriod);
				} else {
					toast.error(result?.error || "Erro ao carregar dados do turno");
					router.push("/dashboard");
				}
			} catch (error) {
				console.error("Erro ao carregar dados:", error);
				toast.error("Erro ao carregar dados do turno");
				router.push("/dashboard");
			} finally {
				setIsLoading(false);
			}
		}

		loadData();
	}, [shiftId, router]);

	if (isLoading) {
		return (
			<div className="container py-10">
				<div className="flex flex-col space-y-4 max-w-3xl mx-auto">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="h-64 bg-muted animate-pulse rounded" />
				</div>
			</div>
		);
	}

	if (!shift) {
		return (
			<div className="container py-10">
				<div className="flex flex-col items-center justify-center space-y-4">
					<h1 className="text-2xl font-bold">Turno não encontrado</h1>
					<Button asChild>
						<Link href="/dashboard">Voltar para o Dashboard</Link>
					</Button>
				</div>
			</div>
		);
	}

	const totalEarnings = shift.uberEarnings + shift.boltEarnings + (shift.otherEarnings || 0);
	const formattedDate = format(new Date(shift.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

	return (
		<div className="container py-10">
			<div className="flex items-center gap-4 mb-6">
				<Button variant="outline" size="icon" asChild>
					<Link href={`/dashboard/weekly-periods/${weeklyPeriod?.id}`}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">Detalhes do Turno</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Informações Gerais</CardTitle>
						<CardDescription>Detalhes do turno realizado em {formattedDate}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							<div className="flex items-center gap-2">
								<Calendar className="h-5 w-5 text-muted-foreground" />
								<span className="font-medium">{formattedDate}</span>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">Veículo</h3>
									<div className="flex items-center gap-2">
										<Car className="h-4 w-4 text-muted-foreground" />
										<span>
											{shift.vehicle?.make} {shift.vehicle?.model} ({shift.vehicle?.year})
										</span>
									</div>
								</div>

								<div className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">Período Semanal</h3>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span>{weeklyPeriod?.name || "Período não especificado"}</span>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">Quilometragem</h3>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="flex flex-col">
										<span className="text-xs text-muted-foreground">Inicial</span>
										<span className="text-lg font-medium">{shift.initialOdometer?.toLocaleString("pt-BR")} km</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-muted-foreground">Final</span>
										<span className="text-lg font-medium">
											{shift.finalOdometer ? `${shift.finalOdometer.toLocaleString("pt-BR")} km` : "Não registrado"}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-muted-foreground">Total</span>
										<span className="text-lg font-medium">{shift.odometer.toLocaleString("pt-BR")} km</span>
									</div>
								</div>
							</div>

							{shift.notes && (
								<div className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground">Observações</h3>
									<p className="text-sm">{shift.notes}</p>
								</div>
							)}

							<div className="flex justify-end">
								<Button variant="outline" asChild>
									<Link href={`/dashboard/shifts/edit/${shift.id}`}>
										<Edit className="mr-2 h-4 w-4" />
										Editar Turno
									</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ganhos</CardTitle>
						<CardDescription>Resumo financeiro do turno</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-sm">Uber</span>
								<span className="font-medium">
									€ {shift.uberEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm">Bolt</span>
								<span className="font-medium">
									€ {shift.boltEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
								</span>
							</div>
							{shift.otherEarnings > 0 && (
								<div className="flex justify-between items-center">
									<span className="text-sm">Outros</span>
									<span className="font-medium">
										€ {shift.otherEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
									</span>
								</div>
							)}
							<div className="border-t pt-2 mt-2">
								<div className="flex justify-between items-center font-bold">
									<span>Total</span>
									<span>€ {totalEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
								</div>
							</div>

							<div className="border-t pt-4 mt-4">
								<div className="flex justify-between items-center">
									<span className="text-sm">Ganho por km</span>
									<span className="font-medium">
										€{" "}
										{shift.odometer > 0
											? (totalEarnings / shift.odometer).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
											: "0,00"}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
