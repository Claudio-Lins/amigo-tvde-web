"use client";

import { deleteExpense, getUserExpenses } from "@/actions/expense-actions";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseCategory } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, PlusIcon, Receipt, Trash } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function translateExpenseCategory(category: ExpenseCategory) {
	const categories: Record<ExpenseCategory, string> = {
		FUEL: "Combustível",
		FOOD: "Alimentação",
		MAINTENANCE: "Manutenção",
		PARKING: "Estacionamento",
		TOLL: "Pedágio",
		RENT: "Aluguel",
		OTHER: "Outros",
	};
	return categories[category];
}

function getCategoryColor(category: ExpenseCategory) {
	const colors: Record<ExpenseCategory, string> = {
		FUEL: "bg-red-100 text-red-800",
		FOOD: "bg-green-100 text-green-800",
		MAINTENANCE: "bg-blue-100 text-blue-800",
		PARKING: "bg-yellow-100 text-yellow-800",
		TOLL: "bg-orange-100 text-orange-800",
		RENT: "bg-pink-100 text-pink-800",
		OTHER: "bg-gray-100 text-gray-800",
	};
	return colors[category];
}

export default function ExpensesPage() {
	const [expenses, setExpenses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [totalAmount, setTotalAmount] = useState(0);

	const fetchExpenses = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await getUserExpenses();
			if (result && result.success) {
				setExpenses(result.expenses || []);

				// Calcular o total de despesas
				const total = result.expenses.reduce((acc: number, expense: any) => acc + expense.amount, 0);
				setTotalAmount(total);
			} else {
				toast.error(result?.error || "Erro ao carregar despesas");
				setExpenses([]);
			}
		} catch (error) {
			toast.error("Erro ao carregar despesas");
			console.error("Erro ao carregar despesas:", error);
			setExpenses([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchExpenses();
	}, [fetchExpenses]);

	function confirmDeleteExpense(id: string) {
		setExpenseToDelete(id);
		setShowDeleteDialog(true);
	}

	async function handleDeleteExpense() {
		if (!expenseToDelete) return;

		try {
			const result = await deleteExpense(expenseToDelete);

			if (result && result.success) {
				toast.success("Despesa excluída com sucesso");
				await fetchExpenses();
			} else {
				toast.error(result?.error || "Erro ao excluir despesa");
			}
		} catch (error) {
			toast.error("Erro ao excluir despesa");
			console.error("Erro ao excluir despesa:", error);
		} finally {
			setShowDeleteDialog(false);
			setExpenseToDelete(null);
		}
	}

	return (
		<div className="container py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Minhas Despesas</h1>
				<Button variant="outline" className="gap-2" asChild>
					<Link href="/dashboard/expenses/new">
						<PlusIcon className="h-4 w-4" />
						<span>Adicionar Despesa</span>
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Despesas Registradas</CardTitle>
					<CardDescription>
						Gerencie suas despesas para acompanhar seus gastos e calcular seu lucro líquido.
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
					) : expenses.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Data</TableHead>
										<TableHead>Categoria</TableHead>
										<TableHead>Descrição</TableHead>
										<TableHead className="text-right">Valor</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{expenses.map((expense) => (
										<TableRow key={expense.id}>
											<TableCell>{format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
											<TableCell>
												<Badge className={getCategoryColor(expense.category)}>
													{translateExpenseCategory(expense.category)}
												</Badge>
											</TableCell>
											<TableCell>{expense.notes || "-"}</TableCell>
											<TableCell className="text-right font-medium">€ {expense.amount.toFixed(2)}</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button variant="outline" size="icon" asChild>
														<Link href={`/dashboard/expenses/${expense.id}/edit`}>
															<Edit className="h-4 w-4" />
														</Link>
													</Button>
													<Button variant="destructive" size="icon" onClick={() => confirmDeleteExpense(expense.id)}>
														<Trash className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="text-center py-8">
							<Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-medium">Nenhuma despesa registrada</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Adicione sua primeira despesa para começar a acompanhar seus gastos.
							</p>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-between">
					<div className="text-sm text-muted-foreground">
						{expenses.length > 0 ? (
							<>
								Total: {expenses.length} despesa{expenses.length > 1 ? "s" : ""}
							</>
						) : null}
					</div>
					{expenses.length > 0 && <div className="text-sm font-medium">Total: € {totalAmount.toFixed(2)}</div>}
				</CardFooter>
			</Card>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteExpense} className="bg-red-600 hover:bg-red-700">
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
