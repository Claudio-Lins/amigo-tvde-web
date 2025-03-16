import { getCurrentOrLatestShift } from "@/actions/shift-actions";
import { checkUser } from "@/lib/check-user";
import { Separator } from "@radix-ui/react-select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HomeButtons } from "./home-buttons";

// Este é um componente de servidor (RSC)
export async function HomeContent() {
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

			{/* Componente cliente para os botões */}
			<HomeButtons />
		</div>
	);
}
