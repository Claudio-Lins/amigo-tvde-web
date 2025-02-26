import { cn } from "@/lib/utils";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<main className="flex flex-col w-full min-h-screen bg-amber-500 pt-20 px-4">
			<div className="flex flex-col w-full h-full">
				<div className="flex flex-col w-full h-full">{children}</div>
			</div>
		</main>
	);
}
