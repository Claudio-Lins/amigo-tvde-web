import { prisma } from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const payload = (await request.json()) as WebhookEvent;
		const eventType = payload.type;

		if (eventType === "user.created") {
			const { id, email_addresses, first_name, last_name, image_url } = payload.data;

			const user = await prisma.user.create({
				data: {
					id,
					email: email_addresses[0]?.email_address ?? "",
					firstName: first_name ?? "",
					lastName: last_name ?? "",
					imageUrl: image_url ?? "",
					clerkId: id,
				},
			});

			return NextResponse.json(user);
		}

		return NextResponse.json({ message: "Webhook processado" });
	} catch (error) {
		console.error("Erro no webhook:", JSON.stringify(error, null, 2));
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
