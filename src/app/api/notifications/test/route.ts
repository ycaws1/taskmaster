import { NextResponse } from "next/server";
import webPush from "web-push";

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

export async function POST(request: Request) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    try {
        const { subscription } = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        const payload = JSON.stringify({
            title: "Test Notification",
            body: "If you see this, notifications are working!",
            icon: "/android-chrome-192x192.png",
            url: "/"
        });

        await webPush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Test notification error:", error);
        return NextResponse.json({ error: "Failed to send notification", details: String(error) }, { status: 500 });
    }
}
