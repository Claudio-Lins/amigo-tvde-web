"use client";

import { deleteWeeklyPeriod, getUserWeeklyPeriods, toggleWeeklyPeriodActive } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyPeriod } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Check, MoreVertical, Pencil, Plus, Power, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function WeeklyPeriodList() {
	const [weeklyPeriods, setWeeklyPeriods] = useState<WeeklyPeriod[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		async function loadWeeklyPeriods() {
			try {
				const result = await getUserWeeklyPeriods();
				if (Array.isArray(result)) {
					setWeeklyPeriods(result);
				} else {
					toast.error("Erro ao carregar períodos semanais");
				}
			} catch (error) {
				console.error("Erro ao carregar períodos semanais:", error);
				toast.error("Erro ao carregar períodos semanais");
			} finally {
				setIsLoading(false);
			}
		}

		loadWeeklyPeriods();
	}, []);

	async function handleToggleActive(id: string) {
		try {
			setIsProcessing(id);
			const result = await toggleWeeklyPeriodActive(id);

			if (result && "success" in result) {
				// Atualizar a lista localmente
				setWeeklyPeriods((prev) =>
					prev.map((period) => {
						if (period.id === id) {
							return { ...period, isActive: !period.isActive };
						}
						if (period.isActive && period.id !== id) {
							return { ...period, isActive: false };
						}
						return period;
					}),
				);

				toast.success("Status do período atualizado com sucesso");
			} else {
				toast.error(result?.error || "Erro ao atualizar status do período");
			}
		} catch (error) {
			console.error("Erro ao atualizar status do período:", error);
			toast.error("Erro ao atualizar status do período");
		} finally {
			setIsProcessing(null);
		}
	}

	async function handleDelete(id: string) {
		try {
			setIsProcessing(id);
			const result = await deleteWeeklyPeriod(id);

			if (result && "success" in result) {
				// Remover o período da lista local
				setWeeklyPeriods((prev) => prev.filter((period) => period.id !== id));
				toast.success("Período excluído com sucesso");
			} else {
				toast.error(result?.error || "Erro ao excluir período");
			}
		} catch (error) {
			console.error("Erro ao excluir período:", error);
			toast.error("Erro ao excluir período");
		} finally {
			setIsProcessing(null);
		}
	}

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{[1, 2, 3].map((i) => (
					<Card key={i} className="overflow-hidden">
						<CardHeader className="pb-2">
							<Skeleton className="h-6 w-3/4 mb-2" />
							<Skeleton className="h-4 w-1/2" />
						</CardHeader>
						<CardContent className="pb-2">
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</CardContent>
						<CardFooter>
							<Skeleton className="h-9 w-full" />
						</CardFooter>
					</Card>
				))}
			</div>
		);
	}

	if (weeklyPeriods.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Calendar className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium mb-2">Nenhum período semanal encontrado</h3>
				<p className="text-muted-foreground mb-6">
					Crie seu primeiro período semanal para começar a registrar seus turnos.
				</p>
				<Button asChild>
					<Link href="/dashboard/weekly-periods/new">
						<Plus className="h-4 w-4 mr-2" />
						Criar Período Semanal
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{weeklyPeriods.map((period) => (
				<Card key={period.id} className={period.isActive ? "border-primary" : ""}>
					<CardHeader className="pb-2">
						<div className="flex justify-between items-start">
							<div>
								<CardTitle className="flex items-center">
									{period.name}
									{period.isActive && (
										<span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
											<Check className="h-3 w-3 mr-1" />
											Ativo
										</span>
									)}
								</CardTitle>
								<CardDescription>
									{format(new Date(period.startDate), "dd/MM/yyyy", { locale: ptBR })} a{" "}
									{format(new Date(period.endDate), "dd/MM/yyyy", { locale: ptBR })}
								</CardDescription>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" disabled={!!isProcessing}>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem asChild>
										<Link href={`/dashboard/weekly-periods/${period.id}`}>
											<Pencil className="h-4 w-4 mr-2" />
											Detalhes
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleToggleActive(period.id)} disabled={isProcessing === period.id}>
										<Power className="h-4 w-4 mr-2" />
										{period.isActive ? "Desativar" : "Ativar"}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleDelete(period.id)}
										disabled={isProcessing === period.id || period.isActive}
										className="text-destructive focus:text-destructive"
									>
										<Trash className="h-4 w-4 mr-2" />
										Excluir
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardHeader>
					<CardContent className="pb-2">
						<div className="space-y-1 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Meta Semanal:</span>
								<span className="font-medium">
									{period.weeklyGoal ? `€ ${period.weeklyGoal.toFixed(2)}` : "Não definida"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Duração:</span>
								<span className="font-medium">7 dias</span>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button variant="outline" className="w-full" asChild>
							<Link href={`/dashboard/weekly-periods/${period.id}`}>Ver Detalhes</Link>
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
