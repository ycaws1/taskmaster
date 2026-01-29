import { prisma } from "@/lib/prisma";
import webPush from "web-push";

// Initialize VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
    try {
        webPush.setVapidDetails(
            vapidSubject,
            vapidPublicKey,
            vapidPrivateKey
        );
    } catch (e) {
        console.error("Failed to set VAPID details:", e);
    }
}

export async function checkAndSendNotifications() {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.error("VAPID keys not configured");
        return { success: false, error: "VAPID keys not configured" };
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
            return { success: true, message: "No notifications due" };
        }

        // Get all subscriptions
        const subscriptions = await prisma.pushSubscription.findMany();

        if (subscriptions.length === 0) {
            return { success: true, message: "No subscriptions found" };
        }

        const notificationsSentIds: string[] = [];

        for (const item of dueItems) {
            const payload = JSON.stringify({
                title: `Task Due: ${item.text}`,
                body: `Your task in "${item.category?.name || 'TaskMaster'}" is due now!`,
                icon: '/android-chrome-192x192.png',
                url: '/'
            });

            console.log('Sending notification payload:', payload);

            // Track delivery status
            let successCount = 0;
            let permanentFailCount = 0;

            // Send to all subscribers
            // We use Promise.allSettled or just map with catch to ensure all are attempted
            const promises = subscriptions.map(sub => {
                return webPush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload)
                    .then(() => {
                        successCount++;
                    })
                    .catch(async (err) => {
                        console.error('Error sending push:', err);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            // Subscription is dead
                            try {
                                await prisma.pushSubscription.delete({ where: { id: sub.id } });
                                permanentFailCount++;
                            } catch (delErr) {
                                console.error('Error deleting dead subscription:', delErr);
                            }
                        }
                        // Other errors (5xx, network) are transient
                    });
            });

            await Promise.all(promises);

            // Mark as sent ONLY if we sent to at least one person, 
            // OR if all subscribers are dead (permanent fail) so we don't retry locally forever.
            if (successCount > 0 || permanentFailCount === subscriptions.length) {
                await prisma.todoItem.update({
                    where: { id: item.id },
                    data: { notificationSent: true }
                });
                notificationsSentIds.push(item.id);
            }
        }

        return {
            success: true,
            sentCount: notificationsSentIds.length,
            items: notificationsSentIds
        };

    } catch (error) {
        console.error("Notification check error:", error);
        return { success: false, error: "Internal server error" };
    }
}
