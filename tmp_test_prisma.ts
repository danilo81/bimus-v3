
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        const userId = "test-user-id"; // Replace with a real ID if needed
        console.log("Testing aggregation...");
        const librarySum = await prisma.libraryFile.aggregate({ where: { userId }, _sum: { size: true } });
        console.log("Library sum:", librarySum);
        
        const projectSum = await (prisma as any).projectDocument.aggregate({ where: { userId }, _sum: { size: true } });
        console.log("Project sum:", projectSum);
        
        console.log("Success!");
    } catch (e) {
        console.error("Error during test:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
