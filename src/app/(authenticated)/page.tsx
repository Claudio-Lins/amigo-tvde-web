import { getCurrentOrLatestShift } from "@/actions/shift-actions";
import { getActiveWeeklyPeriod } from "@/actions/weekly-period-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { checkUser } from "@/lib/check-user";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";

export default async function Home() {
	const user = await checkUser();

	if (!user) {
		redirect("/sign-in");
	}

	// Obter o turno atual ou mais recente
	const shiftResult = await getCurrentOrLatestShift();

	// Obter o período semanal ativo
	const activePeriod = await getActiveWeeklyPeriod();

	// Calcular o valor total dos ganhos usando os campos diretos do turno
	const uberEarnings = shiftResult.shift?.uberEarnings || 0;
	const boltEarnings = shiftResult.shift?.boltEarnings || 0;
	const otherEarnings = shiftResult.shift?.otherEarnings || 0;

	// Somar todos os ganhos
	const totalEarnings = uberEarnings + boltEarnings + otherEarnings;

	// Calcular o progresso da meta (se houver um período ativo)
	let goalProgress = 0;
	let remainingGoal = 0;
	let weeklyGoal = 0;
	let periodDates = { start: new Date(), end: new Date() };

	if (activePeriod && !("error" in activePeriod)) {
		weeklyGoal = activePeriod.weeklyGoal;
		remainingGoal = Math.max(0, weeklyGoal - totalEarnings);
		goalProgress = (totalEarnings / weeklyGoal) * 100;
		periodDates = {
			start: new Date(activePeriod.startDate),
			end: new Date(activePeriod.endDate),
		};
	}

	// Data atual formatada
	const currentDate = new Date();
	const formattedDate = format(currentDate, "dd/MMMM", { locale: pt });

	return (
		<div className="w-full min-h-dvh p-4 flex flex-col items-center">
			{/* Círculo com o valor total */}
			<div className="flex flex-col size-40 items-center justify-center border-8 border-gray-300 p-4 rounded-full">
				<p className="text-2xl font-bold">
					{totalEarnings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
				</p>
			</div>

			{/* Data atual */}
			<p className="text-xl font-bold mt-2">{formattedDate}</p>

			{/* Informações do período atual */}
			{activePeriod && !("error" in activePeriod) && (
				<Card className="w-full mt-4">
					<CardHeader className="pb-2">
						<CardTitle className="text-lg flex items-center">
							<Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
							Período Atual
						</CardTitle>
						<CardDescription>
							{format(periodDates.start, "dd/MM", { locale: pt })} -{" "}
							{format(periodDates.end, "dd/MM/yyyy", { locale: pt })}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Meta:</span>
								<span className="font-medium">{weeklyGoal.toFixed(2)} €</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Ganhos:</span>
								<span className="font-medium">{totalEarnings.toFixed(2)} €</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Restante:</span>
								<span className="font-medium">{remainingGoal > 0 ? remainingGoal.toFixed(2) : "0.00"} €</span>
							</div>

							<div className="mt-4">
								<div className="flex justify-between text-xs mb-1">
									<span>Progresso</span>
									<span>{Math.min(100, Math.round(goalProgress))}%</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2">
									<div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, goalProgress)}%` }} />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<Separator className="w-full my-4" />

			{/* Botões para as plataformas */}
			<div className="flex items-center justify-evenly w-full gap-4 text-white">
				<Button variant="default" className="w-full bg-zinc-900">
					UBER
				</Button>
				<Button variant="default" className="w-full bg-green-600">
					Bolt
				</Button>
				<Button variant="default" className="w-full bg-blue-600">
					Tip
				</Button>
			</div>
		</div>
	);
}
