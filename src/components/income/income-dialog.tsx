"use client";

import { cn } from "@/lib/utils";
import type { Shift } from "@prisma/client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

interface IncomeDialogProps {
	company: string;
	shift?: string;
}

export function IncomeDialog({ company, shift }: IncomeDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="default"
					className={cn(
						"w-full",
						company === "Uber" && "bg-zinc-950",
						company === "Bolt" && "bg-green-600",
						company === "Tip" && "bg-blue-600",
					)}
				>
					{company}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{company}</DialogTitle>
				</DialogHeader>
				<DialogDescription>""</DialogDescription>
			</DialogContent>
		</Dialog>
	);
}
