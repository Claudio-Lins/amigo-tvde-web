import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddWeeklyPeriodForm } from "@/components/weekly-period/add-weekly-period-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWeeklyPeriodPage() {
	return (
		<div className="container py-6 md:py-0 space-y-6">
			<div className="flex items-center">
				<Button variant="ghost" size="icon" asChild className="mr-2">
					<Link href="/dashboard/weekly-periods">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-3xl font-bold">Novo Período Semanal</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Criar Período Semanal</CardTitle>
					<CardDescription>
						Defina um novo período semanal para acompanhar seus turnos e ganhos. Os períodos sempre começam na
						segunda-feira e terminam no domingo.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AddWeeklyPeriodForm />
				</CardContent>
			</Card>
		</div>
	);
}
