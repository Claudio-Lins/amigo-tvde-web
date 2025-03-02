"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Expense, ExpenseCategory } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Função auxiliar para traduzir categorias de despesa
function translateExpenseCategory(category: string): string {
	const translations: Record<string, string> = {
		FUEL: "Combustível",
		FOOD: "Alimentação",
		MAINTENANCE: "Manutenção",
		PARKING: "Estacionamento",
		TOLL: "Pedágio",
		OTHER: "Outros",
	};

	return translations[category] || category;
}

interface ExpenseListProps {
	expenses: Expense[];
	onDelete?: (expenseId: string) => void;
}

export function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	// Ordenar despesas por data (mais recente primeiro)
	const sortedExpenses = [...expenses].sort((a, b) => {
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});

	async function handleDelete(expenseId: string) {
		if (!onDelete) return;

		setIsDeleting(expenseId);
		try {
			await onDelete(expenseId);
		} finally {
			setIsDeleting(null);
		}
	}

	// Calcular total
	const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Data</TableHead>
							<TableHead>Categoria</TableHead>
							<TableHead className="text-right">Valor</TableHead>
							<TableHead>Observações</TableHead>
							<TableHead className="text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedExpenses.map((expense) => (
							<TableRow key={expense.id}>
								<TableCell>{format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
								<TableCell>{translateExpenseCategory(expense.category)}</TableCell>
								<TableCell className="text-right">€ {expense.amount.toFixed(2)}</TableCell>
								<TableCell>{expense.notes || "-"}</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end space-x-2">
										<Button variant="ghost" size="icon" asChild>
											<Link href={`/dashboard/expenses/${expense.id}/edit`}>
												<Edit className="h-4 w-4" />
											</Link>
										</Button>
										{onDelete && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDelete(expense.id)}
												disabled={isDeleting === expense.id}
											>
												<Trash className="h-4 w-4 text-destructive" />
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
						{expenses.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
									Nenhuma despesa registrada para este período.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{expenses.length > 0 && (
				<div className="rounded-md border p-4 bg-muted/50">
					<h3 className="font-medium mb-2">Resumo das Despesas</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Total de Despesas</p>
							<p className="font-medium">€ {totalExpenses.toFixed(2)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Quantidade</p>
							<p className="font-medium">{expenses.length} despesa(s)</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
