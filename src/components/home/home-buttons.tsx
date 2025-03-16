"use client";

import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Este é um componente cliente
export function HomeButtons() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedPlatform, setSelectedPlatform] = useState<"UBER" | "BOLT" | "TIPS">("UBER");

	// Função para abrir o diálogo com a plataforma selecionada
	function openDialog(platform: "UBER" | "BOLT" | "TIPS") {
		setSelectedPlatform(platform);
		setDialogOpen(true);
	}

	return (
		<>
			<div className="flex items-center justify-evenly w-full gap-4 text-white">
				<Button variant="default" className="w-full bg-zinc-900" onClick={() => openDialog("UBER")}>
					UBER
				</Button>
				<Button variant="default" className="w-full bg-green-600" onClick={() => openDialog("BOLT")}>
					Bolt
				</Button>
				<Button variant="default" className="w-full bg-blue-600" onClick={() => openDialog("TIPS")}>
					Tip
				</Button>
			</div>

			<AddIncomeDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} platform={selectedPlatform} />
		</>
	);
}
