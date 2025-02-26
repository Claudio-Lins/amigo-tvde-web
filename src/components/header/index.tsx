import { cn } from "@/lib/utils";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

interface HeaderProps {}

export function Header({}: HeaderProps) {
	return (
		<div className={cn("fixed top-0 left-0 w-full h-16 bg-transparent z-50 shadow-md")}>
			<div className="container mx-auto p-4">
				<div className="flex items-center justify-between">
					<div className="">Logo</div>
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
