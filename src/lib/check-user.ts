import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function checkUser() {
	const user = await currentUser();

	if (!user) {
		return null;
	}

	const userExists = await prisma.user.findUnique({
		where: {
			clerkUserId: user.id,
		},
	});
	if (userExists) {
		return userExists;
	}

	if (!userExists) {
		const newUser = await prisma.user.create({
			data: {
				clerkUserId: user.id,
				email: user.emailAddresses[0].emailAddress,
				firstName: user.firstName,
				lastName: user.lastName,
				imageUrl: user.imageUrl,
			},
		});

		return newUser;
	}
}
