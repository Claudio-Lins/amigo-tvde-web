"use client";

import { getUserShifts } from "@/actions/shift-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Shift } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, LineChart, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ShiftsPage() {
	const [shifts, setShifts] = useState<Shift[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchShifts = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await getUserShifts();
			if (!result) {
				toast.error("Erro ao carregar turnos");
				setShifts([]);
				return;
			}

			if ("error" in result) {
				toast.error(result.error);
				setShifts([]);
				return;
			}

			setShifts(result);
		} catch (error) {
			toast.error("Erro ao carregar turnos");
			console.error("Erro ao carregar turnos:", error);
			setShifts([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchShifts();
	}, [fetchShifts]);

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat("pt-PT", {
			style: "currency",
			currency: "EUR",
		}).format(value);
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Meus Turnos</h1>
				<Button asChild>
					<Link href="/dashboard/shifts/new">
						<Plus className="mr-2 h-4 w-4" />
						Novo Turno
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Turnos Registrados</CardTitle>
					<CardDescription>
						Visualize todos os seus turnos registrados. Clique em um turno para ver mais detalhes.
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
									</div>
								</div>
							))}
						</div>
					) : shifts.length > 0 ? (
						<div className="space-y-4">
							{shifts.map((shift) => (
								<Link
									key={shift.id}
									href={`/dashboard/shifts/${shift.id}`}
									className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
								>
									<div>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<h3 className="font-medium">
												{format(new Date(shift.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
											</h3>
										</div>
										<div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
											<span>Uber: {formatCurrency(shift.uberEarnings)}</span>
											<span>Bolt: {formatCurrency(shift.boltEarnings)}</span>
											<span>Total: {formatCurrency(shift.uberEarnings + shift.boltEarnings)}</span>
										</div>
									</div>
									<Button variant="outline" size="sm">
										Ver Detalhes
									</Button>
								</Link>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<LineChart className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-medium">Nenhum turno registrado</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Adicione seu primeiro turno para começar a acompanhar seus ganhos.
							</p>
							<Button className="mt-4" asChild>
								<Link href="/dashboard/shifts/new">
									<Plus className="mr-2 h-4 w-4" />
									Registrar Novo Turno
								</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
