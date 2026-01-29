import { prisma } from "@/lib/prisma";
import webPush from "web-push";
import { NextResponse } from "next/server";

// Initialize VAPID
// We need to check if keys are present to avoid runtime crashes if env vars are missing
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

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!vapidPublicKey || !vapidPrivateKey) {
        return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
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
            return NextResponse.json({ message: "No notifications due" });
        }

        // Get all subscriptions
        const subscriptions = await prisma.pushSubscription.findMany();

        if (subscriptions.length === 0) {
            return NextResponse.json({ message: "No subscriptions found" });
        }

        const notificationsSentIds = [];

        for (const item of dueItems) {
            const payload = JSON.stringify({
                title: `Task Due: ${item.text}`,
                body: `Your task in "${item.category.name}" is due now!`,
                icon: '/android-chrome-192x192.png',
                url: '/'
            });


            // Track delivery status
            let successCount = 0;
            let permanentFailCount = 0;

            // Send to all subscribers
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
                            await prisma.pushSubscription.delete({ where: { id: sub.id } });
                            permanentFailCount++;
                        }
                        // Other errors (5xx, network) are transient, we don't count them as permanent failure
                    });
            });

            await Promise.all(promises);

            // Mark as sent ONLY if we sent to at least one person, 
            // OR if all subscribers are dead (permanent fail) so we don't retry locally forever.
            // If we had transient errors (like quota exceeded or temp server error), we should NOT mark as sent so it retries.
            if (successCount > 0 || permanentFailCount === subscriptions.length) {
                await prisma.todoItem.update({
                    where: { id: item.id },
                    data: { notificationSent: true }
                });
                notificationsSentIds.push(item.id);
            }
        }

        return NextResponse.json({
            success: true,
            sentCount: notificationsSentIds.length,
            items: notificationsSentIds
        });

    } catch (error) {
        console.error("Notification check error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
