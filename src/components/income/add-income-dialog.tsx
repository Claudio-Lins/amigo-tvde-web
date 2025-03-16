"use client";

import { addEarningsToShift, getCurrentOrLatestShift } from "@/actions/shift-actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shift } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Schema para validação do formulário
const addIncomeSchema = z.object({
	amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero"),
	shiftId: z.string().min(1, "Selecione um turno"),
});

type AddIncomeFormData = z.infer<typeof addIncomeSchema>;

interface AddIncomeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	platform: "UBER" | "BOLT" | "TIPS";
}

export function AddIncomeDialog({ isOpen, onClose, platform }: AddIncomeDialogProps) {
	const router = useRouter();
	const [shifts, setShifts] = useState<Shift[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);

	// Configurar o formulário
	const form = useForm<AddIncomeFormData>({
		resolver: zodResolver(addIncomeSchema),
		defaultValues: {
			amount: 0,
			shiftId: "",
		},
	});

	// Carregar turnos e definir o turno atual como padrão
	useEffect(() => {
		async function loadShifts() {
			setIsLoading(true);
			try {
				// Obter o turno atual/mais recente
				const currentShiftResult = await getCurrentOrLatestShift();

				if (currentShiftResult.shift) {
					setCurrentShiftId(currentShiftResult.shift.id);
					form.setValue("shiftId", currentShiftResult.shift.id);
				}

				// Obter todos os turnos (poderia ser limitado aos mais recentes)
				const response = await fetch("/api/shifts");
				if (response.ok) {
					const data = await response.json();
					setShifts(data);
				}
			} catch (error) {
				console.error("Erro ao carregar turnos:", error);
				toast.error("Erro ao carregar turnos");
			} finally {
				setIsLoading(false);
			}
		}

		if (isOpen) {
			loadShifts();
		}
	}, [isOpen, form]);

	// Função para lidar com o envio do formulário
	async function onSubmit(data: AddIncomeFormData) {
		setIsSubmitting(true);
		try {
			const result = await addEarningsToShift({
				platform,
				amount: data.amount,
				shiftId: data.shiftId,
			});

			if (result.success) {
				toast.success(result.message || "Ganho adicionado com sucesso!");
				form.reset();
				onClose();
				router.refresh();
			} else {
				toast.error(result.error || "Erro ao adicionar ganho");
			}
		} catch (error) {
			console.error("Erro ao adicionar ganho:", error);
			toast.error("Erro ao adicionar ganho");
		} finally {
			setIsSubmitting(false);
		}
	}

	// Obter o título e cor com base na plataforma
	const getPlatformInfo = () => {
		switch (platform) {
			case "UBER":
				return { title: "Adicionar Ganho Uber", color: "bg-zinc-900" };
			case "BOLT":
				return { title: "Adicionar Ganho Bolt", color: "bg-green-600" };
			case "TIPS":
				return { title: "Adicionar Gorjeta", color: "bg-blue-600" };
		}
	};

	const { title, color } = getPlatformInfo();

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						Adicione o valor ganho na plataforma {platform === "TIPS" ? "como gorjeta" : platform}.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* Campo de valor */}
						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Valor (€)</FormLabel>
									<FormControl>
										<Input {...field} type="number" step="0.01" min="0.01" placeholder="0.00" disabled={isSubmitting} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Seleção de turno */}
						<FormField
							control={form.control}
							name="shiftId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Turno</FormLabel>
									<Select
										disabled={isLoading || isSubmitting}
										onValueChange={field.onChange}
										value={field.value}
										defaultValue={currentShiftId || undefined}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione um turno" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{shifts.map((shift) => (
												<SelectItem key={shift.id} value={shift.id}>
													{format(new Date(shift.date), "dd/MM/yyyy", { locale: ptBR })} -
													{shift.odometer ? ` ${shift.odometer.toFixed(0)} km` : ""}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="mt-4">
							<Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
								Cancelar
							</Button>
							<Button type="submit" className={color} disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
									</>
								) : (
									"Adicionar"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
