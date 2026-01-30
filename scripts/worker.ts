import { prisma } from "../src/lib/prisma";
import webPush from "web-push";

// Initialize VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
    webPush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );
}

async function checkNotifications() {
    console.log(`[${new Date().toISOString()}] Checking for due notifications...`);

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.error("VAPID keys not configured");
        return;
    }

    try {
        const now = new Date();

        // Find items due for notification
        const dueItems = await prisma.todoItem.findMany({
            where: {
                notificationAt: {
                    lte: now,
                    not: null
                },
                notificationSent: false
            },
            include: {
                category: true
            }
        });

        if (dueItems.length === 0) {
            console.log("No notifications due");
            return;
        }

        console.log(`Found ${dueItems.length} due items`);

        // Get all subscriptions
        const subscriptions = await prisma.pushSubscription.findMany();

        if (subscriptions.length === 0) {
            console.log("No subscriptions found");
            return;
        }

        const subscriptionsToDelete = new Set<string>();

        for (const item of dueItems) {
            const payload = JSON.stringify({
                title: `Task Due: ${item.text}`,
                body: `Your task in "${item.category.name}" is due now!`,
                icon: '/android-chrome-192x192.png',
                url: '/'
            });

            console.log(`Sending for item "${item.text}" to ${subscriptions.length} subs`);

            const sendPromises = subscriptions.map(async (sub) => {
                try {
                    await webPush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    }, payload);
                } catch (err: any) {
                    // console.error('Error sending push:', err.statusCode);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        subscriptionsToDelete.add(sub.id);
                    }
                }
            });

            await Promise.all(sendPromises);

            await prisma.todoItem.update({
                where: { id: item.id },
                data: { notificationSent: true }
            });
        }

        // Cleanup dead subscriptions
        if (subscriptionsToDelete.size > 0) {
            console.log('Cleaning up', subscriptionsToDelete.size, 'expired subscriptions');
            await prisma.pushSubscription.deleteMany({
                where: {
                    id: { in: Array.from(subscriptionsToDelete) }
                }
            });
        }

    } catch (error) {
        console.error("Notification check error:", error);
    }
}

// Run immediately then every 60 seconds
checkNotifications();
setInterval(checkNotifications, 10000);
