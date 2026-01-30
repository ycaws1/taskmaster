
import { prisma } from "../src/lib/prisma";

async function clearSubscriptions() {
    console.log("Clearing all push subscriptions...");
    const result = await prisma.pushSubscription.deleteMany({});
    console.log(`Deleted ${result.count} subscriptions.`);
}

clearSubscriptions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
