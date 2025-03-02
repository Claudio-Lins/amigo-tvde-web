"use client";

import { getActiveWeeklyPeriod } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ActivePeriodCheck() {
	const [checked, setChecked] = useState(false);
	const pathname = usePathname();

	// Não mostrar em páginas de períodos semanais para evitar redundância
	const shouldCheck = !pathname.includes("/weekly-periods");

	useEffect(() => {
		if (!shouldCheck || checked) return;

		async function checkActivePeriod() {
			try {
				const result = await getActiveWeeklyPeriod();

				if (!result || "error" in result) {
					// Mostrar toast apenas se não estiver na página de períodos
					toast.warning(
						<div className="flex flex-col gap-2">
							<p>Não há período semanal ativo.</p>
							<p className="text-sm">Algumas funcionalidades como registro de turnos requerem um período ativo.</p>
							<Button asChild size="sm" className="mt-2">
								<Link href="/dashboard/weekly-periods/new">Criar Período Semanal</Link>
							</Button>
						</div>,
						{
							duration: 10000, // 10 segundos
							id: "no-active-period", // Evita duplicatas
						},
					);
				}
			} catch (error) {
				console.error("Erro ao verificar período ativo:", error);
			} finally {
				setChecked(true);
			}
		}

		checkActivePeriod();
	}, [shouldCheck, checked, pathname]);

	// Este componente não renderiza nada visualmente
	return null;
}
