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
    console.log("Test notification endpoint called");

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.error("VAPID keys missing:", {
            hasPublic: !!vapidPublicKey,
            hasPrivate: !!vapidPrivateKey
        });
        return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { subscription } = body;

        console.log("Received subscription:", subscription ? "Yes" : "No");

        if (!subscription || !subscription.endpoint) {
            console.error("Invalid subscription payload:", body);
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        console.log("Sending test notification to:", subscription.endpoint.slice(0, 30) + "...");

        const payload = JSON.stringify({
            title: "Test Notification",
            body: "If you see this, notifications are working!",
            icon: "/android-chrome-192x192.png",
            url: "/"
        });

        const result = await webPush.sendNotification(subscription, payload);
        console.log("Notification sent successfully status:", result.statusCode);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("Test notification error:", error);
        console.error("Error details:", {
            statusCode: error.statusCode,
            headers: error.headers,
            body: error.body
        });
        return NextResponse.json({ error: "Failed to send notification", details: String(error) }, { status: 500 });
    }
}
