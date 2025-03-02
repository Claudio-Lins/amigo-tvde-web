"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shift } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ShiftListProps {
	shifts: Shift[];
	onDelete?: (shiftId: string) => void;
}

export function ShiftList({ shifts, onDelete }: ShiftListProps) {
	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	// Ordenar turnos por data (mais recente primeiro)
	const sortedShifts = [...shifts].sort((a, b) => {
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});

	async function handleDelete(shiftId: string) {
		if (!onDelete) return;

		setIsDeleting(shiftId);
		try {
			await onDelete(shiftId);
		} finally {
			setIsDeleting(null);
		}
	}

	// Calcular totais
	const totalUber = shifts.reduce((sum, shift) => sum + (shift.uberEarnings || 0), 0);
	const totalBolt = shifts.reduce((sum, shift) => sum + (shift.boltEarnings || 0), 0);
	const totalOther = shifts.reduce((sum, shift) => sum + (shift.otherEarnings || 0), 0);
	const totalEarnings = totalUber + totalBolt + totalOther;
	const totalDistance = shifts.reduce((sum, shift) => sum + (shift.odometer || 0), 0);

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Data</TableHead>
							<TableHead className="text-right">Uber</TableHead>
							<TableHead className="text-right">Bolt</TableHead>
							<TableHead className="text-right">Outros</TableHead>
							<TableHead className="text-right">Total</TableHead>
							<TableHead className="text-right">Km</TableHead>
							<TableHead className="text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedShifts.map((shift) => (
							<TableRow key={shift.id}>
								<TableCell>{format(new Date(shift.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}</TableCell>
								<TableCell className="text-right">€ {shift.uberEarnings.toFixed(2)}</TableCell>
								<TableCell className="text-right">€ {shift.boltEarnings.toFixed(2)}</TableCell>
								<TableCell className="text-right">€ {(shift.otherEarnings || 0).toFixed(2)}</TableCell>
								<TableCell className="text-right font-medium">
									€ {((shift.uberEarnings || 0) + (shift.boltEarnings || 0) + (shift.otherEarnings || 0)).toFixed(2)}
								</TableCell>
								<TableCell className="text-right">{shift.odometer} km</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end space-x-2">
										<Button variant="ghost" size="icon" asChild>
											<Link href={`/dashboard/shifts/${shift.id}/edit`}>
												<Edit className="h-4 w-4" />
											</Link>
										</Button>
										{onDelete && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(shift.id)}
												disabled={isDeleting === shift.id}
											>
												<Trash className="h-4 w-4 text-destructive" />
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
						{shifts.length === 0 && (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
									Nenhum turno registrado para este período.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{shifts.length > 0 && (
				<div className="rounded-md border p-4 bg-muted/50">
					<h3 className="font-medium mb-2">Resumo dos Turnos</h3>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Uber</p>
							<p className="font-medium">€ {totalUber.toFixed(2)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Bolt</p>
							<p className="font-medium">€ {totalBolt.toFixed(2)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Outros</p>
							<p className="font-medium">€ {totalOther.toFixed(2)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Total</p>
							<p className="font-medium">€ {totalEarnings.toFixed(2)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Distância</p>
							<p className="font-medium">{totalDistance} km</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
