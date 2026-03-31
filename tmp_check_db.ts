import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        const po = await prisma.purchaseOrder.findFirst({
            select: {
                id: true,
                number: true,
                authorId: true,
                notes: true
            }
        });
        console.log("Success! Found PO or columns exist:", po ? "PO exists" : "Table is empty but query worked");
    } catch (e) {
        console.error("Failed to query authorId:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
