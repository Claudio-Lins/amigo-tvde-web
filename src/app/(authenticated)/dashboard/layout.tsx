import { Sidebar } from "@/components/sidebar";
import { ActivePeriodCheck } from "@/components/weekly-period/active-period-check";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex-1 w-full">
				<ActivePeriodCheck />
				<main className="p-4 md:p-6">{children}</main>
			</div>
		</div>
	);
}
