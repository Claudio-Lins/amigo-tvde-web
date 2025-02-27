import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

interface SignInProps {}

export default function SignIn({}: SignInProps) {
	return (
		<SignedOut>
			{/* Conteúdo mostrado apenas para usuários não autenticados */}
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
				<div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900">Amigo TVDE App</h1>
						<p className="mt-2 text-gray-600">Faça login para acessar a plataforma</p>
					</div>
					<div className="flex justify-center mt-6">
						<SignInButton mode="modal">
							<Button className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
								Entrar na aplicação
							</Button>
						</SignInButton>
					</div>
				</div>
			</div>
		</SignedOut>
	);
}
