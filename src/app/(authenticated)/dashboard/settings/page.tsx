"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Bell, Car, Check, Fuel, LogOut, Plus, Save, Shield, Trash, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Esquema de validação para o perfil
const profileFormSchema = z.object({
	name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres" }),
	email: z.string().email({ message: "Email inválido" }),
	phone: z.string().min(9, { message: "Número de telefone inválido" }).optional().or(z.literal("")),
	avatarUrl: z.string().optional(),
});

// Esquema de validação para o veículo
const vehicleFormSchema = z.object({
	model: z.string().min(2, { message: "O modelo deve ter pelo menos 2 caracteres" }),
	year: z.coerce
		.number()
		.min(1900, { message: "Ano inválido" })
		.max(new Date().getFullYear() + 1),
	licensePlate: z.string().min(5, { message: "Placa inválida" }),
	fuelType: z.enum(["gasoline", "diesel", "electric", "hybrid"], {
		message: "Selecione um tipo de combustível válido",
	}),
	consumption: z.coerce.number().positive({ message: "O consumo deve ser um número positivo" }),
});

// Esquema de validação para as preferências
const preferencesFormSchema = z.object({
	darkMode: z.boolean().default(false),
	notifications: z.boolean().default(true),
	language: z.enum(["pt", "en", "es"], {
		message: "Selecione um idioma válido",
	}),
	currency: z.enum(["EUR", "USD", "BRL"], {
		message: "Selecione uma moeda válida",
	}),
});

// Esquema de validação para o formulário de segurança
const securityFormSchema = z
	.object({
		currentPassword: z.string().min(1, { message: "A senha atual é obrigatória" }),
		newPassword: z
			.string()
			.min(8, { message: "A nova senha deve ter pelo menos 8 caracteres" })
			.regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
			.regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
			.regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" }),
		confirmPassword: z.string().min(1, { message: "Confirme a nova senha" }),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState("profile");
	const [vehicles, setVehicles] = useState([
		{
			id: "1",
			model: "Tesla Model 3",
			year: 2022,
			licensePlate: "AA-00-BB",
			fuelType: "electric",
			consumption: 16.5, // kWh/100km
			isDefault: true,
		},
		{
			id: "2",
			model: "Renault Clio",
			year: 2020,
			licensePlate: "CC-11-DD",
			fuelType: "gasoline",
			consumption: 5.8, // L/100km
			isDefault: false,
		},
	]);
	const [profileSuccess, setProfileSuccess] = useState(false);
	const [vehicleSuccess, setVehicleSuccess] = useState(false);
	const [preferencesSuccess, setPreferencesSuccess] = useState(false);
	const [securitySuccess, setSecuritySuccess] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Formulário de perfil
	const profileForm = useForm<z.infer<typeof profileFormSchema>>({
		resolver: zodResolver(profileFormSchema),
		defaultValues: {
			name: "João Silva",
			email: "joao.silva@exemplo.com",
			phone: "912345678",
			avatarUrl: "",
		},
	});

	// Formulário de veículo
	const vehicleForm = useForm<z.infer<typeof vehicleFormSchema>>({
		resolver: zodResolver(vehicleFormSchema),
		defaultValues: {
			model: "",
			year: new Date().getFullYear(),
			licensePlate: "",
			fuelType: "gasoline",
			consumption: 0,
		},
	});

	// Formulário de preferências
	const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
		resolver: zodResolver(preferencesFormSchema),
		defaultValues: {
			darkMode: false,
			notifications: true,
			language: "pt",
			currency: "EUR",
		},
	});

	// Formulário de segurança
	const securityForm = useForm<z.infer<typeof securityFormSchema>>({
		resolver: zodResolver(securityFormSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	// Função para salvar o perfil
	function onProfileSubmit(data: z.infer<typeof profileFormSchema>) {
		setIsSubmitting(true);

		// Simular uma chamada de API
		setTimeout(() => {
			console.log(JSON.stringify(data, null, 2));
			setProfileSuccess(true);
			setIsSubmitting(false);

			// Esconder a mensagem de sucesso após 3 segundos
			setTimeout(() => setProfileSuccess(false), 3000);
		}, 1000);
	}

	// Função para adicionar um novo veículo
	function onVehicleSubmit(data: z.infer<typeof vehicleFormSchema>) {
		const newVehicle = {
			id: Date.now().toString(),
			...data,
			isDefault: vehicles.length === 0, // Primeiro veículo é o padrão
		};

		setVehicles([...vehicles, newVehicle]);
		vehicleForm.reset();
		alert("Veículo adicionado com sucesso!");
	}

	// Função para definir um veículo como padrão
	function setDefaultVehicle(id: string) {
		setVehicles(
			vehicles.map((vehicle) => ({
				...vehicle,
				isDefault: vehicle.id === id,
			})),
		);
	}

	// Função para remover um veículo
	function removeVehicle(id: string) {
		setVehicles(vehicles.filter((vehicle) => vehicle.id !== id));
	}

	// Função para salvar as preferências
	function onPreferencesSubmit(data: z.infer<typeof preferencesFormSchema>) {
		setIsSubmitting(true);

		// Simular uma chamada de API
		setTimeout(() => {
			console.log(JSON.stringify(data, null, 2));
			setPreferencesSuccess(true);
			setIsSubmitting(false);

			// Esconder a mensagem de sucesso após 3 segundos
			setTimeout(() => setPreferencesSuccess(false), 3000);
		}, 1000);
	}

	// Função para lidar com o envio do formulário de segurança
	function handleSecuritySubmit(data: z.infer<typeof securityFormSchema>) {
		setIsSubmitting(true);

		// Simular uma chamada de API
		setTimeout(() => {
			console.log(JSON.stringify(data, null, 2));
			setSecuritySuccess(true);
			setIsSubmitting(false);

			// Limpar os campos de senha
			securityForm.reset({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});

			// Esconder a mensagem de sucesso após 3 segundos
			setTimeout(() => setSecuritySuccess(false), 3000);
		}, 1000);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Configurações</h1>
				<p className="text-muted-foreground">
					Gerencie suas informações pessoais, veículos e preferências do aplicativo.
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList>
					<TabsTrigger value="profile">Perfil</TabsTrigger>
					<TabsTrigger value="vehicles">Veículos</TabsTrigger>
					<TabsTrigger value="preferences">Preferências</TabsTrigger>
					<TabsTrigger value="security">Segurança</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Informações Pessoais</CardTitle>
							<CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
						</CardHeader>
						<Form {...profileForm}>
							<form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
								<CardContent className="space-y-4">
									<FormField
										control={profileForm.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome Completo</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={profileForm.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input type="email" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={profileForm.control}
										name="phone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Telefone</FormLabel>
												<FormControl>
													<Input type="tel" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
								<CardFooter>
									<Button type="submit" className="mt-4">
										<Save className="mr-2 h-4 w-4" />
										Salvar Alterações
									</Button>
								</CardFooter>
							</form>
						</Form>
					</Card>
				</TabsContent>

				<TabsContent value="vehicles" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Meus Veículos</CardTitle>
							<CardDescription>Gerencie os veículos que você utiliza para o TVDE.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{vehicles.length > 0 ? (
								<div className="space-y-4">
									{vehicles.map((vehicle) => (
										<div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
											<div>
												<h3 className="font-medium">
													{vehicle.model} ({vehicle.year})
												</h3>
												<p className="text-sm text-muted-foreground">
													Placa: {vehicle.licensePlate} | Combustível:{" "}
													{vehicle.fuelType === "gasoline"
														? "Gasolina"
														: vehicle.fuelType === "diesel"
															? "Diesel"
															: vehicle.fuelType === "electric"
																? "Elétrico"
																: "Híbrido"}{" "}
													| Consumo: {vehicle.consumption} {vehicle.fuelType === "electric" ? "kWh/100km" : "L/100km"}
												</p>
											</div>
											<div className="flex items-center space-x-2">
												<Button
													variant={vehicle.isDefault ? "default" : "outline"}
													size="sm"
													onClick={() => setDefaultVehicle(vehicle.id)}
													disabled={vehicle.isDefault}
												>
													{vehicle.isDefault ? "Padrão" : "Definir como Padrão"}
												</Button>
												<Button
													variant="destructive"
													size="icon"
													onClick={() => removeVehicle(vehicle.id)}
													disabled={vehicles.length === 1}
												>
													<Trash className="h-4 w-4" />
												</Button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-4">
									<p className="text-muted-foreground">Nenhum veículo cadastrado.</p>
								</div>
							)}

							<Separator />

							<div>
								<h3 className="font-medium mb-4">Adicionar Novo Veículo</h3>
								<Form {...vehicleForm}>
									<form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<FormField
												control={vehicleForm.control}
												name="model"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Modelo</FormLabel>
														<FormControl>
															<Input {...field} placeholder="Ex: Tesla Model 3" />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={vehicleForm.control}
												name="year"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Ano</FormLabel>
														<FormControl>
															<Input type="number" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<FormField
												control={vehicleForm.control}
												name="licensePlate"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Placa</FormLabel>
														<FormControl>
															<Input {...field} placeholder="Ex: AA-00-BB" />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={vehicleForm.control}
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
																<SelectItem value="gasoline">Gasolina</SelectItem>
																<SelectItem value="diesel">Diesel</SelectItem>
																<SelectItem value="electric">Elétrico</SelectItem>
																<SelectItem value="hybrid">Híbrido</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={vehicleForm.control}
											name="consumption"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Consumo Médio</FormLabel>
													<FormControl>
														<Input type="number" step="0.1" {...field} />
													</FormControl>
													<FormDescription>
														{vehicleForm.watch("fuelType") === "electric"
															? "kWh/100km para veículos elétricos"
															: "L/100km para veículos a combustão"}
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button type="submit">
											<Plus className="mr-2 h-4 w-4" />
											Adicionar Veículo
										</Button>
									</form>
								</Form>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="preferences" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Preferências do Aplicativo</CardTitle>
							<CardDescription>Personalize sua experiência no aplicativo.</CardDescription>
						</CardHeader>
						<Form {...preferencesForm}>
							<form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}>
								<CardContent className="space-y-4">
									<FormField
										control={preferencesForm.control}
										name="darkMode"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">Modo Escuro</FormLabel>
													<FormDescription>Ativar o tema escuro para o aplicativo.</FormDescription>
												</div>
												<FormControl>
													<Switch checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
											</FormItem>
										)}
									/>

									<FormField
										control={preferencesForm.control}
										name="notifications"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">Notificações</FormLabel>
													<FormDescription>Receber notificações sobre atualizações e lembretes.</FormDescription>
												</div>
												<FormControl>
													<Switch checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={preferencesForm.control}
											name="language"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Idioma</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Selecione o idioma" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="pt">Português</SelectItem>
															<SelectItem value="en">English</SelectItem>
															<SelectItem value="es">Español</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={preferencesForm.control}
											name="currency"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Moeda</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Selecione a moeda" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="EUR">Euro (€)</SelectItem>
															<SelectItem value="USD">Dólar ($)</SelectItem>
															<SelectItem value="BRL">Real (R$)</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
								<CardFooter>
									<Button type="submit" className="mt-4">
										<Save className="mr-2 h-4 w-4" />
										Salvar Preferências
									</Button>
								</CardFooter>
							</form>
						</Form>
					</Card>
				</TabsContent>

				<TabsContent value="security" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Segurança</CardTitle>
							<CardDescription>Gerencie sua segurança e senhas.</CardDescription>
						</CardHeader>
						<Form {...securityForm}>
							<form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)}>
								<CardContent className="space-y-4">
									<FormField
										control={securityForm.control}
										name="currentPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Senha Atual</FormLabel>
												<FormControl>
													<Input type="password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={securityForm.control}
										name="newPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nova Senha</FormLabel>
												<FormControl>
													<Input type="password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={securityForm.control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Confirmar Nova Senha</FormLabel>
												<FormControl>
													<Input type="password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>

								{securitySuccess && (
									<Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
										<Check className="h-4 w-4" />
										<AlertTitle>Senha atualizada</AlertTitle>
										<AlertDescription>Sua senha foi atualizada com sucesso.</AlertDescription>
									</Alert>
								)}

								<CardFooter>
									<Button type="submit" disabled={isSubmitting} className="mt-4">
										{isSubmitting ? "Salvando..." : "Salvar Alterações"}
									</Button>
								</CardFooter>
							</form>
						</Form>
					</Card>
				</TabsContent>
			</Tabs>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="text-red-600">Zona de Perigo</CardTitle>
					<CardDescription>Ações que podem afetar permanentemente sua conta</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<h3 className="font-medium mb-1">Excluir Todos os Dados</h3>
							<p className="text-sm text-muted-foreground mb-2">
								Esta ação excluirá permanentemente todos os seus dados de entradas diárias, preços de combustível e
								relatórios.
							</p>
							<Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
								Excluir Todos os Dados
							</Button>
						</div>

						<Separator />

						<div>
							<h3 className="font-medium mb-1">Excluir Conta</h3>
							<p className="text-sm text-muted-foreground mb-2">
								Esta ação excluirá permanentemente sua conta e todos os dados associados. Esta ação não pode ser
								desfeita.
							</p>
							<Button variant="destructive">Excluir Minha Conta</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
