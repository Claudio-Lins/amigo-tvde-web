"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, MapPin, Plus, Search, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Esquema de validação para o formulário de novo preço
const priceFormSchema = z.object({
	date: z.string().min(1, { message: "A data é obrigatória" }),
	fuelType: z.enum(["gasoline", "diesel", "electric"], {
		message: "Selecione um tipo de combustível válido",
	}),
	price: z.coerce.number().min(0, { message: "O preço deve ser um número positivo" }),
	location: z.string().min(1, { message: "A localização é obrigatória" }),
	notes: z.string().optional().or(z.literal("")),
});

export default function FuelPricesPage() {
	const [activeTab, setActiveTab] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [editingPrice, setEditingPrice] = useState<any>(null);

	// Dados de exemplo para os preços de combustível
	const [fuelPrices, setFuelPrices] = useState<
		Array<{
			id: string;
			date: string;
			fuelType: "electric" | "gasoline" | "diesel";
			price: number;
			location: string;
			notes?: string;
		}>
	>([
		{
			id: "1",
			date: "2023-06-30",
			fuelType: "electric",
			price: 0.25,
			location: "Posto de Carregamento - Braga",
			notes: "Carregador rápido 50kW",
		},
		{
			id: "2",
			date: "2023-06-28",
			fuelType: "gasoline",
			price: 1.65,
			location: "Posto Galp - Porto",
			notes: "Gasolina 95",
		},
		{
			id: "3",
			date: "2023-06-25",
			fuelType: "diesel",
			price: 1.45,
			location: "Posto Repsol - Lisboa",
			notes: "Diesel normal",
		},
		{
			id: "4",
			date: "2023-06-22",
			fuelType: "electric",
			price: 0.3,
			location: "Posto de Carregamento - Lisboa",
			notes: "Carregador lento 22kW",
		},
		{
			id: "5",
			date: "2023-06-20",
			fuelType: "gasoline",
			price: 1.68,
			location: "Posto BP - Coimbra",
			notes: "Gasolina 98",
		},
		{
			id: "6",
			date: "2023-06-18",
			fuelType: "diesel",
			price: 1.48,
			location: "Posto Prio - Aveiro",
			notes: "Diesel aditivado",
		},
		{
			id: "7",
			date: "2023-06-15",
			fuelType: "electric",
			price: 0.22,
			location: "Posto de Carregamento - Porto",
			notes: "Carregador doméstico",
		},
		{
			id: "8",
			date: "2023-06-12",
			fuelType: "gasoline",
			price: 1.63,
			location: "Posto Intermarché - Braga",
			notes: "Gasolina 95",
		},
	]);

	// Formulário para adicionar novo preço
	const addForm = useForm<z.infer<typeof priceFormSchema>>({
		resolver: zodResolver(priceFormSchema),
		defaultValues: {
			date: format(new Date(), "yyyy-MM-dd"),
			fuelType: "electric",
			price: 0,
			location: "",
			notes: "",
		},
	});

	// Formulário para editar preço existente
	const editForm = useForm<z.infer<typeof priceFormSchema>>({
		resolver: zodResolver(priceFormSchema),
		defaultValues: {
			date: "",
			fuelType: "electric",
			price: 0,
			location: "",
			notes: "",
		},
	});

	// Filtrar preços com base na aba ativa e termo de busca
	const filteredPrices = fuelPrices.filter((price) => {
		// Filtrar por tipo de combustível se não estiver na aba "todos"
		const matchesTab = activeTab === "all" || price.fuelType === activeTab;

		// Filtrar por termo de busca (localização ou notas)
		const matchesSearch =
			searchTerm === "" ||
			price.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(price.notes && price.notes.toLowerCase().includes(searchTerm.toLowerCase()));

		return matchesTab && matchesSearch;
	});

	// Função para formatar o tipo de combustível
	function formatFuelType(type: string) {
		const types = {
			electric: "Elétrico",
			gasoline: "Gasolina",
			diesel: "Diesel",
		};
		return types[type as keyof typeof types] || type;
	}

	// Função para formatar o preço com base no tipo de combustível
	function formatPrice(price: number, type: string) {
		if (type === "electric") {
			return `€${price.toFixed(2)}/kWh`;
		}
		return `€${price.toFixed(2)}/L`;
	}

	// Função para adicionar novo preço
	function handleAddPrice(values: z.infer<typeof priceFormSchema>) {
		const newPrice = {
			id: Date.now().toString(),
			...values,
			notes: values.notes || "",
		};

		setFuelPrices([newPrice, ...fuelPrices]);
		setShowAddDialog(false);
		addForm.reset({
			date: format(new Date(), "yyyy-MM-dd"),
			fuelType: "electric",
			price: 0,
			location: "",
			notes: "",
		});
	}

	// Função para abrir o diálogo de edição
	function handleEditClick(price: any) {
		setEditingPrice(price);
		editForm.reset({
			date: price.date,
			fuelType: price.fuelType,
			price: price.price,
			location: price.location,
			notes: price.notes || "",
		});
		setShowEditDialog(true);
	}

	// Função para atualizar um preço existente
	function handleUpdatePrice(values: z.infer<typeof priceFormSchema>) {
		const updatedPrices = fuelPrices.map((price) => (price.id === editingPrice.id ? { ...price, ...values } : price));

		setFuelPrices(updatedPrices);
		setShowEditDialog(false);
	}

	// Função para excluir um preço
	function handleDeletePrice(id: string) {
		const updatedPrices = fuelPrices.filter((price) => price.id !== id);
		setFuelPrices(updatedPrices);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold">Preços de Combustível</h1>
				<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Adicionar Preço
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Adicionar Novo Preço</DialogTitle>
							<DialogDescription>Registre um novo preço de combustível ou energia.</DialogDescription>
						</DialogHeader>
						<Form {...addForm}>
							<form onSubmit={addForm.handleSubmit(handleAddPrice)} className="space-y-4">
								<FormField
									control={addForm.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Data</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={addForm.control}
									name="fuelType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de Combustível</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o tipo de combustível" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="electric">Elétrico</SelectItem>
													<SelectItem value="gasoline">Gasolina</SelectItem>
													<SelectItem value="diesel">Diesel</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={addForm.control}
									name="price"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Preço</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} />
											</FormControl>
											<FormDescription>{addForm.watch("fuelType") === "electric" ? "€/kWh" : "€/L"}</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={addForm.control}
									name="location"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Localização</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormDescription>Nome do posto ou local de carregamento</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={addForm.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Notas</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormDescription>Informações adicionais (opcional)</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<DialogFooter>
									<Button type="submit">Adicionar</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle>Histórico de Preços</CardTitle>
							<CardDescription>Acompanhe os preços de combustível e energia em diferentes locais</CardDescription>
						</div>
						<div className="relative w-full sm:w-64">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar por localização..."
								className="pl-8"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="mb-4">
							<TabsTrigger value="all">Todos</TabsTrigger>
							<TabsTrigger value="electric">Elétrico</TabsTrigger>
							<TabsTrigger value="gasoline">Gasolina</TabsTrigger>
							<TabsTrigger value="diesel">Diesel</TabsTrigger>
						</TabsList>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead>Preço</TableHead>
									<TableHead className="hidden md:table-cell">Localização</TableHead>
									<TableHead className="hidden lg:table-cell">Notas</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPrices.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
											Nenhum preço encontrado. Adicione um novo preço para começar.
										</TableCell>
									</TableRow>
								) : (
									filteredPrices.map((price) => (
										<TableRow key={price.id}>
											<TableCell>{format(parseISO(price.date), "dd/MM/yyyy")}</TableCell>
											<TableCell>{formatFuelType(price.fuelType)}</TableCell>
											<TableCell>{formatPrice(price.price, price.fuelType)}</TableCell>
											<TableCell className="hidden md:table-cell">
												<div className="flex items-center">
													<MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
													{price.location}
												</div>
											</TableCell>
											<TableCell className="hidden lg:table-cell text-muted-foreground">{price.notes}</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button variant="ghost" size="icon" onClick={() => handleEditClick(price)}>
														<Edit className="h-4 w-4" />
													</Button>
													<Button variant="ghost" size="icon" onClick={() => handleDeletePrice(price.id)}>
														<Trash className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Tabs>
				</CardContent>
				<CardFooter>
					<div className="text-sm text-muted-foreground">
						Mostrando {filteredPrices.length} de {fuelPrices.length} preços
					</div>
				</CardFooter>
			</Card>

			{/* Diálogo de edição */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Preço</DialogTitle>
						<DialogDescription>Atualize as informações do preço registrado.</DialogDescription>
					</DialogHeader>
					<Form {...editForm}>
						<form onSubmit={editForm.handleSubmit(handleUpdatePrice)} className="space-y-4">
							<FormField
								control={editForm.control}
								name="date"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Data</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={editForm.control}
								name="fuelType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Combustível</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o tipo de combustível" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="electric">Elétrico</SelectItem>
												<SelectItem value="gasoline">Gasolina</SelectItem>
												<SelectItem value="diesel">Diesel</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={editForm.control}
								name="price"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Preço</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormDescription>{editForm.watch("fuelType") === "electric" ? "€/kWh" : "€/L"}</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={editForm.control}
								name="location"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Localização</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription>Nome do posto ou local de carregamento</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={editForm.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notas</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormDescription>Informações adicionais (opcional)</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button type="submit">Salvar Alterações</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
