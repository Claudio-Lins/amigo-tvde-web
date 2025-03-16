import { getCurrentOrLatestShift } from "@/actions/shift-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddVehicleForm } from "@/components/vehicle/add-vehicle-form";
import { checkUser } from "@/lib/check-user";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CarIcon, TrendingUpIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
	const user = await checkUser();

	if (!user) {
		redirect("/sign-in");
	}

	// Obter o turno atual ou mais recente
	const shiftResult = await getCurrentOrLatestShift();

	// Calcular o valor total do turno (soma de todos os rendimentos)
	const totalEarnings = shiftResult.shift?.ShiftIncome?.reduce((total, income) => total + income.amount, 0) || 0;

	// Obter a data do turno ou a data atual
	const shiftDate = shiftResult.shift?.date || new Date();

	// Formatar a data
	const formattedDate = format(shiftDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

	return (
		<div className="w-full min-h-dvh p-4 flex flex-col items-center max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-6">Bem-vindo ao Amigo TVDE</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
				{/* Card do Turno Atual */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg flex items-center">
							<CalendarIcon className="mr-2 h-5 w-5" />
							Turno {shiftResult.shift ? "Atual" : "Não Iniciado"}
						</CardTitle>
						<CardDescription>
							{shiftResult.shift ? "Informações do seu turno atual" : "Inicie um turno para começar a registrar"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Data:</span>
								<span className="font-medium">{formattedDate}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Ganhos:</span>
								<span className="font-bold text-xl">
									{totalEarnings.toLocaleString("pt-BR", { style: "currency", currency: "EUR" })}
								</span>
							</div>
							{shiftResult.shift?.vehicle && (
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Veículo:</span>
									<span className="font-medium">
										{shiftResult.shift.vehicle.brand} {shiftResult.shift.vehicle.model}
									</span>
								</div>
							)}
						</div>

						{!shiftResult.shift && (
							<Link
								href="/dashboard/shifts/new"
								className="mt-4 block w-full bg-primary text-primary-foreground py-2 px-4 rounded text-center hover:bg-primary/90 transition-colors"
							>
								Iniciar Novo Turno
							</Link>
						)}

						{shiftResult.shift && (
							<Link
								href={`/dashboard/shifts/${shiftResult.shift.id}`}
								className="mt-4 block w-full bg-primary text-primary-foreground py-2 px-4 rounded text-center hover:bg-primary/90 transition-colors"
							>
								Ver Detalhes do Turno
							</Link>
						)}
					</CardContent>
				</Card>

				{/* Card de Estatísticas Rápidas */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg flex items-center">
							<TrendingUpIcon className="mr-2 h-5 w-5" />
							Estatísticas Rápidas
						</CardTitle>
						<CardDescription>Resumo da sua atividade</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Ganhos Hoje:</span>
								<span className="font-bold">
									{totalEarnings.toLocaleString("pt-BR", { style: "currency", currency: "EUR" })}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Odômetro:</span>
								<span className="font-medium">{shiftResult.shift?.odometer?.toLocaleString("pt-BR") || "0"} km</span>
							</div>
						</div>

						<Link
							href="/dashboard"
							className="mt-4 block w-full bg-secondary text-secondary-foreground py-2 px-4 rounded text-center hover:bg-secondary/90 transition-colors"
						>
							Ver Dashboard Completo
						</Link>
					</CardContent>
				</Card>
			</div>

			<div className="flex gap-4 w-full">
				<Link
					href="/dashboard/shifts/new"
					className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
				>
					Novo Turno
				</Link>
				<Link
					href="/dashboard/fuel-records/new"
					className="flex-1 bg-secondary text-secondary-foreground py-3 px-4 rounded text-center hover:bg-secondary/90 transition-colors"
				>
					Registrar Combustível
				</Link>
			</div>
		</div>
	);
}
