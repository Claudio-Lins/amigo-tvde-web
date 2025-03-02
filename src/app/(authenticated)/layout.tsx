"use client";

import { Button } from "@/components/ui/button";
import { ActivePeriodCheck } from "@/components/weekly-period/active-period-check";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Componente de navegação reutilizável
function Navigation({ onClick }: { onClick?: () => void }) {
	const pathname = usePathname();

	const menuItems = [
		{ href: "/dashboard", icon: "📊", label: "Visão Geral" },
		{ href: "/dashboard/daily-entries", icon: "📝", label: "Entradas Diárias" },
		{ href: "/dashboard/vehicles", icon: "🚗", label: "Veículos" },
		{ href: "/dashboard/reports", icon: "📈", label: "Relatórios" },
		{ href: "/dashboard/shifts/new", icon: "⏰", label: "Turnos" },
		{ href: "/dashboard/settings", icon: "⚙️", label: "Configurações" },
	];

	return (
		<ul className="space-y-2">
			{menuItems.map((item) => (
				<li key={item.href}>
					<Link
						href={item.href}
						className={`flex items-center p-3 rounded-lg transition-colors ${
							pathname === item.href ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
						}`}
						onClick={onClick}
					>
						<span className="mr-3">{item.icon}</span>
						{item.label}
					</Link>
				</li>
			))}
		</ul>
	);
}

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<ActivePeriodCheck />
			{children}
		</>
	);
}
