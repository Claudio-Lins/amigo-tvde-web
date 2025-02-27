import { cn } from "@/lib/utils";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

interface HeaderProps {}

export function Header({}: HeaderProps) {
	return (
		<div className={cn("fixed top-0 left-0 w-full h-16 bg-transparent z-50 shadow-md")}>
			<div className="container mx-auto p-4">
				<div className="flex items-center justify-between">
					<div className="">
						<Menu size={24} />
					</div>
					<div className="font-bold">AMIGO-TVDE</div>
					<div className="">
						<SignedIn>
							<UserButton />
						</SignedIn>
						<SignedOut>
							<SignInButton />
						</SignedOut>
					</div>
				</div>
			</div>
		</div>
	);
}
