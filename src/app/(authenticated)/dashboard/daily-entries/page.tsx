"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Download,
	Filter,
	Plus,
	Search,
	SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DailyEntriesPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("date-desc");
	const [filterMonth, setFilterMonth] = useState<Date | undefined>(new Date());
	const [currentPage, setCurrentPage] = useState(1);
	const [showFilters, setShowFilters] = useState(false);
	const entriesPerPage = 10;

	// Dados de exemplo para a listagem
	const allEntries = [
		{ id: "1", date: "2023-06-30", distance: 120, earnings: 95.0, costs: 15.0, netEarnings: 80.0 },
		{ id: "2", date: "2023-06-29", distance: 150, earnings: 110.0, costs: 18.0, netEarnings: 92.0 },
		{ id: "3", date: "2023-06-28", distance: 100, earnings: 85.0, costs: 12.0, netEarnings: 73.0 },
		{ id: "4", date: "2023-06-27", distance: 130, earnings: 100.0, costs: 16.0, netEarnings: 84.0 },
		{ id: "5", date: "2023-06-26", distance: 90, earnings: 75.0, costs: 10.0, netEarnings: 65.0 },
		{ id: "6", date: "2023-06-25", distance: 110, earnings: 90.0, costs: 14.0, netEarnings: 76.0 },
		{ id: "7", date: "2023-06-24", distance: 140, earnings: 105.0, costs: 17.0, netEarnings: 88.0 },
		{ id: "8", date: "2023-06-23", distance: 125, earnings: 98.0, costs: 15.5, netEarnings: 82.5 },
		{ id: "9", date: "2023-06-22", distance: 135, earnings: 102.0, costs: 16.2, netEarnings: 85.8 },
		{ id: "10", date: "2023-06-21", distance: 115, earnings: 92.0, costs: 14.5, netEarnings: 77.5 },
		{ id: "11", date: "2023-06-20", distance: 105, earnings: 88.0, costs: 13.8, netEarnings: 74.2 },
		{ id: "12", date: "2023-06-19", distance: 145, earnings: 108.0, costs: 17.5, netEarnings: 90.5 },
		{ id: "13", date: "2023-06-18", distance: 95, earnings: 80.0, costs: 11.0, netEarnings: 69.0 },
		{ id: "14", date: "2023-06-17", distance: 130, earnings: 100.0, costs: 16.0, netEarnings: 84.0 },
		{ id: "15", date: "2023-06-16", distance: 120, earnings: 95.0, costs: 15.0, netEarnings: 80.0 },
		{ id: "16", date: "2023-06-15", distance: 110, earnings: 90.0, costs: 14.0, netEarnings: 76.0 },
		{ id: "17", date: "2023-06-14", distance: 140, earnings: 105.0, costs: 17.0, netEarnings: 88.0 },
		{ id: "18", date: "2023-06-13", distance: 125, earnings: 98.0, costs: 15.5, netEarnings: 82.5 },
		{ id: "19", date: "2023-06-12", distance: 135, earnings: 102.0, costs: 16.2, netEarnings: 85.8 },
		{ id: "20", date: "2023-06-11", distance: 115, earnings: 92.0, costs: 14.5, netEarnings: 77.5 },
		{ id: "21", date: "2023-05-30", distance: 120, earnings: 95.0, costs: 15.0, netEarnings: 80.0 },
		{ id: "22", date: "2023-05-29", distance: 150, earnings: 110.0, costs: 18.0, netEarnings: 92.0 },
		{ id: "23", date: "2023-05-28", distance: 100, earnings: 85.0, costs: 12.0, netEarnings: 73.0 },
		{ id: "24", date: "2023-05-27", distance: 130, earnings: 100.0, costs: 16.0, netEarnings: 84.0 },
		{ id: "25", date: "2025-02-26", distance: 90, earnings: 75.0, costs: 10.0, netEarnings: 65.0 },
	];

	// Filtrar entradas por mês
	const filteredByMonth = filterMonth
		? allEntries.filter((entry) => {
				const entryDate = parseISO(entry.date);
				const start = startOfMonth(filterMonth);
				const end = endOfMonth(filterMonth);
				return isWithinInterval(entryDate, { start, end });
			})
		: allEntries;

	// Filtrar entradas por termo de busca
	const filteredEntries = searchTerm
		? filteredByMonth.filter(
				(entry) =>
					entry.date.includes(searchTerm) ||
					entry.distance.toString().includes(searchTerm) ||
					entry.earnings.toString().includes(searchTerm) ||
					entry.costs.toString().includes(searchTerm) ||
					entry.netEarnings.toString().includes(searchTerm),
			)
		: filteredByMonth;

	// Ordenar entradas
	const sortedEntries = [...filteredEntries].sort((a, b) => {
		switch (sortBy) {
			case "date-asc":
				return a.date.localeCompare(b.date);
			case "date-desc":
				return b.date.localeCompare(a.date);
			case "distance-asc":
				return a.distance - b.distance;
			case "distance-desc":
				return b.distance - a.distance;
			case "earnings-asc":
				return a.earnings - b.earnings;
			case "earnings-desc":
				return b.earnings - a.earnings;
			case "costs-asc":
				return a.costs - b.costs;
			case "costs-desc":
				return b.costs - a.costs;
			case "net-asc":
				return a.netEarnings - b.netEarnings;
			case "net-desc":
				return b.netEarnings - a.netEarnings;
			default:
				return b.date.localeCompare(a.date);
		}
	});

	// Calcular paginação
	const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
	const startIndex = (currentPage - 1) * entriesPerPage;
	const paginatedEntries = sortedEntries.slice(startIndex, startIndex + entriesPerPage);

	// Calcular totais para as entradas filtradas
	const totalDistance = filteredEntries.reduce((sum, entry) => sum + entry.distance, 0);
	const totalEarnings = filteredEntries.reduce((sum, entry) => sum + entry.earnings, 0);
	const totalCosts = filteredEntries.reduce((sum, entry) => sum + entry.costs, 0);
	const totalNetEarnings = filteredEntries.reduce((sum, entry) => sum + entry.netEarnings, 0);

	// Função para formatar valores monetários
	function formatCurrency(value: number) {
		return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
	}

	// Função para formatar datas
	function formatDate(dateString: string) {
		const date = parseISO(dateString);
		return format(date, "dd/MM/yyyy", { locale: ptBR });
	}

	// Função para navegar entre meses
	function navigateMonth(direction: "prev" | "next") {
		if (filterMonth) {
			setFilterMonth(subMonths(filterMonth, direction === "prev" ? 1 : -1));
		}
	}

	// Função para exportar dados
	function handleExport() {
		console.log(JSON.stringify({ exportedEntries: filteredEntries }, null, 2));
		alert("Exportação iniciada. Os dados serão baixados em breve.");
		// Aqui você implementaria a lógica real de exportação
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold">Entradas Diárias</h1>

				<div className="flex flex-col sm:flex-row gap-2">
					<Link href="/dashboard/daily-entries/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Nova Entrada
						</Button>
					</Link>

					<Button variant="outline" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" />
						Exportar
					</Button>
				</div>
			</div>

			{/* Filtros e Busca */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex items-center">
							<CardTitle>Entradas</CardTitle>
							<Button variant="ghost" size="sm" className="ml-2" onClick={() => setShowFilters(!showFilters)}>
								<SlidersHorizontal className="h-4 w-4 mr-1" />
								Filtros
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
								<ChevronLeft className="h-4 w-4" />
							</Button>

							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" className="min-w-[180px]">
										<CalendarIcon className="mr-2 h-4 w-4" />
										{filterMonth ? format(filterMonth, "MMMM yyyy", { locale: ptBR }) : "Selecione o mês"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar mode="single" selected={filterMonth} onSelect={setFilterMonth} initialFocus locale={ptBR} />
								</PopoverContent>
							</Popover>

							<Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{showFilters && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							<div className="flex items-center space-x-2">
								<Search className="h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar entradas..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="flex-1"
								/>
							</div>

							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger>
									<SelectValue placeholder="Ordenar por" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="date-desc">Data (mais recente)</SelectItem>
									<SelectItem value="date-asc">Data (mais antiga)</SelectItem>
									<SelectItem value="distance-desc">Distância (maior)</SelectItem>
									<SelectItem value="distance-asc">Distância (menor)</SelectItem>
									<SelectItem value="earnings-desc">Ganhos (maior)</SelectItem>
									<SelectItem value="earnings-asc">Ganhos (menor)</SelectItem>
									<SelectItem value="costs-desc">Custos (maior)</SelectItem>
									<SelectItem value="costs-asc">Custos (menor)</SelectItem>
									<SelectItem value="net-desc">Líquido (maior)</SelectItem>
									<SelectItem value="net-asc">Líquido (menor)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}

					<CardDescription className="pt-2">{filteredEntries.length} entradas encontradas</CardDescription>
				</CardHeader>

				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Data</TableHead>
								<TableHead>Distância</TableHead>
								<TableHead>Ganhos</TableHead>
								<TableHead>Custos</TableHead>
								<TableHead className="text-right">Líquido</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedEntries.length > 0 ? (
								paginatedEntries.map((entry) => (
									<TableRow key={entry.id}>
										<TableCell>
											<Link href={`/dashboard/daily-entries/${entry.id}`} className="font-medium hover:underline">
												{formatDate(entry.date)}
											</Link>
										</TableCell>
										<TableCell>{entry.distance} km</TableCell>
										<TableCell>{formatCurrency(entry.earnings)}</TableCell>
										<TableCell>{formatCurrency(entry.costs)}</TableCell>
										<TableCell className="text-right">{formatCurrency(entry.netEarnings)}</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-4">
										Nenhuma entrada encontrada para os filtros selecionados.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>

				<CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
						<div>
							Total Distância: <span className="font-medium">{totalDistance} km</span>
						</div>
						<div>
							Total Ganhos: <span className="font-medium">{formatCurrency(totalEarnings)}</span>
						</div>
						<div>
							Total Custos: <span className="font-medium">{formatCurrency(totalCosts)}</span>
						</div>
						<div>
							Total Líquido: <span className="font-medium">{formatCurrency(totalNetEarnings)}</span>
						</div>
					</div>

					{totalPages > 1 && (
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm">
								Página {currentPage} de {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}
