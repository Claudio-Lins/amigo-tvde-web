"use client";

import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import { Calendar, Car, CreditCard, Home, LineChart, LogOut, Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const menuItems = [
	{
		title: "Dashboard",
		href: "/dashboard",
		icon: Home,
	},
	{
		title: "Períodos Semanais",
		href: "/dashboard/weekly-periods",
		icon: Calendar,
	},
	{
		title: "Turnos",
		href: "/dashboard/shifts",
		icon: LineChart,
	},
	{
		title: "Veículos",
		href: "/dashboard/vehicles",
		icon: Car,
	},
	{
		title: "Despesas",
		href: "/dashboard/expenses",
		icon: CreditCard,
	},
	{
		title: "Configurações",
		href: "/dashboard/settings",
		icon: Settings,
	},
];

export function Sidebar() {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	// Fechar o drawer quando a rota muda
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	// Fechar o drawer quando a tela é redimensionada para desktop
	useEffect(() => {
		function handleResize() {
			if (window.innerWidth >= 768) {
				setMobileOpen(false);
			}
		}

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<>
			{/* Sidebar para Desktop */}
			<div
				className={cn(
					"hidden md:flex h-screen bg-background border-r flex-col transition-all duration-300",
					collapsed ? "w-16" : "w-64",
				)}
			>
				<div className="p-4 border-b flex justify-between items-center">
					{!collapsed && <h1 className="font-bold text-xl">Amigo TVDE</h1>}
					<Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
						<Menu className="h-5 w-5" />
					</Button>
				</div>

				<div className="flex-1 py-4 overflow-y-auto">
					<nav className="space-y-1 px-2">
						{menuItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center px-3 py-2 rounded-md text-sm transition-colors",
									pathname === item.href
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
								{!collapsed && <span>{item.title}</span>}
							</Link>
						))}
					</nav>
				</div>

				<div className="p-4 border-t">
					<SignOutButton>
						<Button variant="ghost" className="w-full justify-start">
							<LogOut className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
							{!collapsed && <span>Sair</span>}
						</Button>
					</SignOutButton>
				</div>
			</div>

			{/* Header para Mobile */}
			<div className="md:hidden flex items-center justify-between h-16 px-4 bg-background border-b fixed top-0 left-0 right-0 z-10">
				<div className="flex items-center">
					<Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
						<Menu className="h-5 w-5" />
					</Button>
					<h1 className="font-bold text-xl ml-2">Amigo TVDE</h1>
				</div>
				<SignOutButton>
					<Button variant="ghost" size="icon">
						<LogOut className="h-5 w-5" />
					</Button>
				</SignOutButton>
			</div>

			{/* Drawer para Mobile */}
			<div
				className={cn(
					"md:hidden fixed inset-0 z-50 transition-opacity duration-300",
					mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
			>
				{/* Overlay */}
				<div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />

				{/* Drawer Content */}
				<div
					className={cn(
						"absolute top-0 left-0 w-64 h-full bg-background transform transition-transform duration-300",
						mobileOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					{/* Drawer Header */}
					<div className="flex items-center justify-between p-4 border-b">
						<h2 className="text-lg font-bold">Amigo TVDE</h2>
						<Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
							<X className="h-5 w-5" />
						</Button>
					</div>

					{/* Drawer Menu */}
					<div className="flex-1 py-4 overflow-y-auto">
						<nav className="space-y-1 px-2">
							{menuItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center px-3 py-2 rounded-md text-sm transition-colors",
										pathname === item.href
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
									onClick={() => setMobileOpen(false)}
								>
									<item.icon className="h-5 w-5 mr-3" />
									<span>{item.title}</span>
								</Link>
							))}
						</nav>
					</div>

					<div className="p-4 border-t">
						<SignOutButton>
							<Button variant="ghost" className="w-full justify-start">
								<LogOut className="h-5 w-5 mr-3" />
								<span>Sair</span>
							</Button>
						</SignOutButton>
					</div>
				</div>
			</div>

			{/* Espaçador para Mobile */}
			<div className="md:hidden h-16" />
		</>
	);
}
