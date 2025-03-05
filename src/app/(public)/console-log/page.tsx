import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { User } from "@prisma/client";

async function getUsers() {
	const users = await prisma.user.findMany();
	return users;
}

async function getVehicles() {
	const vehicles = await prisma.vehicle.findMany();
	return vehicles;
}

async function getShifts() {
	const shifts = await prisma.shift.findMany();
	return shifts;
}

async function getExpenses() {
	const expenses = await prisma.expense.findMany();
	return expenses;
}

async function getFuelRecords() {
	const fuelRecords = await prisma.fuelRecord.findMany();
	return fuelRecords;
}

async function getWeeklyPeriods() {
	const weeklyPeriods = await prisma.weeklyPeriod.findMany();
	return weeklyPeriods;
}

interface ConsoleLogProps {}

export default async function ConsoleLog({}: ConsoleLogProps) {
	const users = await getUsers();
	const vehicles = await getVehicles();
	const shifts = await getShifts();
	const expenses = await getExpenses();
	const fuelRecords = await getFuelRecords();
	const weeklyPeriods = await getWeeklyPeriods();
	return (
		<div className={cn("container mx-auto")}>
			<Tabs defaultValue="account" className="w-[400px]">
				<TabsList>
					<TabsTrigger value="users">Users</TabsTrigger>
					<TabsTrigger value="vehicles">Vehicles</TabsTrigger>
					<TabsTrigger value="shifts">Shifts</TabsTrigger>
					<TabsTrigger value="expenses">Expenses</TabsTrigger>
					<TabsTrigger value="fuelRecords">Fuel Records</TabsTrigger>
					<TabsTrigger value="weeklyPeriods">Weekly Periods</TabsTrigger>
				</TabsList>
				<TabsContent value="users">
					<pre className="text-xs">{JSON.stringify(users, null, 2)}</pre>
				</TabsContent>
				<TabsContent value="vehicles">
					<pre className="text-xs">{JSON.stringify(vehicles, null, 2)}</pre>
				</TabsContent>
				<TabsContent value="shifts">
					<pre className="text-xs">{JSON.stringify(shifts, null, 2)}</pre>
				</TabsContent>
				<TabsContent value="expenses">
					<pre className="text-xs">{JSON.stringify(expenses, null, 2)}</pre>
				</TabsContent>
				<TabsContent value="fuelRecords">
					<pre className="text-xs">{JSON.stringify(fuelRecords, null, 2)}</pre>
				</TabsContent>
				<TabsContent value="weeklyPeriods">
					<pre className="text-xs">{JSON.stringify(weeklyPeriods, null, 2)}</pre>
				</TabsContent>
			</Tabs>
		</div>
	);
}
