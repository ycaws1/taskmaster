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
        const subscriptionsToDelete = new Set<string>();

        // We process items sequentially to ensure DB updates don't conflict, 
        // though parallel is possible, sequential is safer for now.
        for (const item of dueItems) {
            let itemSentCount = 0;

            const payload = JSON.stringify({
                title: `Task Due: ${item.text}`,
                body: `Your task in "${item.category.name}" is due now!`,
                icon: '/android-chrome-192x192.png',
                url: '/'
            });

            console.log('Sending notification payload:', payload, 'to', subscriptions.length, 'subscribers');

            const sendPromises = subscriptions.map(async (sub) => {
                try {
                    await webPush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    }, payload);
                    itemSentCount++;
                } catch (err: any) {
                    console.error('Error sending push to', sub.id, err.statusCode);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        subscriptionsToDelete.add(sub.id);
                    }
                    // Swallow other errors to allow other notifications to proceed
                }
            });

            await Promise.all(sendPromises);

            // Mark as sent if we attempted to send to everyone.
            // Even if nobody successfully received it (e.g. all expired), we should mark it as processed
            // to prevent infinite retries on dead subscriptions.
            // Use update many if needed, but here we update one by one.
            await prisma.todoItem.update({
                where: { id: item.id },
                data: { notificationSent: true }
            });
            notificationsSentIds.push(item.id);
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

        return NextResponse.json({
            success: true,
            sentCount: notificationsSentIds.length,
            items: notificationsSentIds,
            cleanedSubscriptions: subscriptionsToDelete.size
        });

    } catch (error) {
        console.error("Notification check error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
