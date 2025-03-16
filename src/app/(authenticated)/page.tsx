"use client";

import { getCurrentOrLatestShift } from "@/actions/shift-actions";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { Button } from "@/components/ui/button";
import { checkUser } from "@/lib/check-user";
import { Separator } from "@radix-ui/react-select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function HomePage() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedPlatform, setSelectedPlatform] = useState<"UBER" | "BOLT" | "TIPS">("UBER");

	// Função para abrir o diálogo com a plataforma selecionada
	function openDialog(platform: "UBER" | "BOLT" | "TIPS") {
		setSelectedPlatform(platform);
		setDialogOpen(true);
	}

	return (
		<>
			<HomeContent openDialog={openDialog} />

			<AddIncomeDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} platform={selectedPlatform} />
		</>
	);
}

// Componente de conteúdo que será renderizado no servidor
async function HomeContent({ openDialog }: { openDialog: (platform: "UBER" | "BOLT" | "TIPS") => void }) {
	const user = await checkUser();

	if (!user) {
		return null; // Será redirecionado pelo middleware
	}

	// Obter o turno atual ou mais recente
	const shiftResult = await getCurrentOrLatestShift();

	// Calcular o valor total dos ganhos usando os campos diretos do turno
	const uberEarnings = shiftResult.shift?.uberEarnings || 0;
	const boltEarnings = shiftResult.shift?.boltEarnings || 0;
	const otherEarnings = shiftResult.shift?.otherEarnings || 0;

	// Somar todos os ganhos
	const totalEarnings = uberEarnings + boltEarnings + otherEarnings;

	// Usar sempre a data atual
	const currentDate = new Date();

	// Formatar a data atual
	const formattedDate = format(currentDate, "dd/MMMM", { locale: ptBR });

	return (
		<div className="w-full min-h-dvh p-4 flex flex-col items-center">
			<div className="flex flex-col size-40 items-center justify-center border-8 border-gray-300 p-4 rounded-full">
				<p className="text-2xl font-bold">
					{totalEarnings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
				</p>
			</div>
			<p className="text-xl font-bold mt-2">{formattedDate}</p>
			<Separator className="w-full my-4" />
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
		</div>
	);
}
