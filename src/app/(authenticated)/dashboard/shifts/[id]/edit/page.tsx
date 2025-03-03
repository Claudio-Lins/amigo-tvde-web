"use client";

import { getShiftById, updateShift } from "@/actions/shift-actions";
import { getVehicles } from "@/actions/vehicle-actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { shiftSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof shiftSchema>;

export default function RedirectToCorrectEditPage() {
	const router = useRouter();
	const params = useParams();
	const shiftId = params.id as string;

	useEffect(() => {
		router.replace(`/dashboard/shifts/edit/${shiftId}`);
	}, [router, shiftId]);

	return (
		<div className="container py-10">
			<p className="text-center">Redirecionando para a página correta de edição...</p>
		</div>
	);
}
