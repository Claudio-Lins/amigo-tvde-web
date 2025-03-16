import { getCurrentOrLatestShift } from "@/actions/shift-actions";
import { checkUser } from "@/lib/check-user";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { redirect } from "next/navigation";

export default async function Home() {
	const user = await checkUser();

	if (!user) {
		redirect("/sign-in");
	}

	// Obter o turno atual ou mais recente
	const shiftResult = await getCurrentOrLatestShift();

	// Calcular o valor total do turno (soma de todos os rendimentos)
	const totalEarnings = shiftResult.shift?.ShiftIncome?.reduce((total, income) => total + income.amount, 0) || 0;

	// Usar sempre a data atual
	const currentDate = new Date();

	// Formatar a data atual
	const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

	return (
		<div className="w-full min-h-dvh p-4 flex flex-col items-center">
			<h1 className="text-3xl font-bold mb-6">Bem-vindo ao Amigo TVDE</h1>

			<div>
				<p>Data: {formattedDate}</p>
				<p>Valor: {totalEarnings.toLocaleString("pt-BR", { style: "currency", currency: "EUR" })}</p>
			</div>
		</div>
	);
}
