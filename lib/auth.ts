import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import prisma from "./prisma";
import { dash } from "@better-auth/infra";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [
        dash()
    ]
});

export async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

