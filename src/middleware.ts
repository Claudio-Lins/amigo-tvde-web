import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = [
	{ path: "/sign-in", wenAuthenticated: "redirect" },
	{ path: "/", wenAuthenticated: "next" },
] as const;

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/sign-in";

export default clerkMiddleware(async (auth, request: NextRequest) => {
	const user = await auth();
	const path = request.nextUrl.pathname;
	const publicRoute = publicRoutes.find((route) => route.path === path);

	if (!user?.userId && publicRoute) {
		return NextResponse.next();
	}

	if (!user?.userId && !publicRoute) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE;
		return NextResponse.redirect(redirectUrl);
	}

	// if (user?.userId && publicRoute) {
	// 	const redirectUrl = request.nextUrl.clone();
	// 	redirectUrl.pathname = "/dashboard";
	// 	return NextResponse.redirect(redirectUrl);
	// }

	// if (user?.userId && publicRoute && publicRoute.wenAuthenticated === "redirect") {
	// 	const redirectUrl = request.nextUrl.clone();
	// 	redirectUrl.pathname = "/dashboard";
	// 	return NextResponse.redirect(redirectUrl);
	// }

	if (user?.userId && !publicRoute) {
		return NextResponse.next();
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
