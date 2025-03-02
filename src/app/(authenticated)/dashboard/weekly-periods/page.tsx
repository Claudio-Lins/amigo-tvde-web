"use client";
import { deleteWeeklyPeriod, getUserWeeklyPeriods } from "@/actions/weekly-period-actions";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWeeklyPeriodForm } from "@/components/weekly-period/add-weekly-period-form";
import { WeeklyPeriodList } from "@/components/weekly-period/weekly-period-list";
import type { WeeklyPeriod } from "@prisma/client";
import { Calendar, Check, ChevronRight, Plus, Target, Trash } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function WeeklyPeriodsPage() {
	return (
		<div className="container py-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Períodos Semanais</h1>
				<Button asChild>
					<Link href="/dashboard/weekly-periods/new">
						<Plus className="h-4 w-4 mr-2" />
						Novo Período
					</Link>
				</Button>
			</div>

			<p className="text-muted-foreground">
				Gerencie seus períodos semanais de trabalho. Cada período começa na segunda-feira e termina no domingo.
			</p>

			<WeeklyPeriodList />
		</div>
	);
}
