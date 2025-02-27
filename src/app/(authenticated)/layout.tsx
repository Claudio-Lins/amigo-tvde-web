"use client";

import { Button } from "@/components/ui/button";
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
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const pathname = usePathname();

	// Fechar o drawer quando a rota muda
	useEffect(() => {
		setIsDrawerOpen(false);
	}, []);

	function toggleDrawer() {
		setIsDrawerOpen(!isDrawerOpen);
	}

	return (
		<div className="flex h-screen bg-gray-100">
			{/* Sidebar para Desktop */}
			<div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r">
				<div className="p-6 border-b">
					<h1 className="text-xl font-bold">Amigo TVDE</h1>
				</div>
				<nav className="flex-1 p-4">
					<Navigation />
				</nav>
			</div>

			{/* Conteúdo Principal */}
			<div className="flex flex-col flex-1 md:pl-64">
				{/* Header */}
				<header className="flex items-center justify-between h-16 px-4 bg-white border-b">
					<div className="flex items-center md:hidden">
						<Button
							onClick={toggleDrawer}
							className="p-2 mr-2 text-gray-600 rounded-md hover:bg-gray-100"
							aria-label="Menu"
						>
							<Menu size={24} />
						</Button>
						<h1 className="text-xl font-bold">Amigo TVDE</h1>
					</div>
					<div className="ml-auto">
						<UserButton afterSignOutUrl="/" />
					</div>
				</header>

				{/* Drawer para Mobile */}
				<div
					className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
						isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
					}`}
				>
					{/* Overlay */}
					<div className="absolute inset-0 bg-black/50" onClick={toggleDrawer} />

					{/* Drawer Content */}
					<div
						className={`absolute top-0 left-0 w-64 h-full bg-white transform transition-transform duration-300 ${
							isDrawerOpen ? "translate-x-0" : "-translate-x-full"
						}`}
					>
						{/* Drawer Header */}
						<div className="flex items-center justify-between p-4 border-b">
							<h2 className="text-lg font-bold">Menu</h2>
							<Button
								onClick={toggleDrawer}
								className="p-2 text-gray-600 rounded-md hover:bg-gray-100"
								aria-label="Fechar menu"
							>
								<X size={20} />
							</Button>
						</div>

						{/* Drawer Menu */}
						<nav className="p-4">
							<Navigation onClick={toggleDrawer} />
						</nav>
					</div>
				</div>

				{/* Conteúdo da Página */}
				<main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
			</div>
		</div>
	);
}
