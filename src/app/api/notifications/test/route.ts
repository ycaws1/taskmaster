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


const NOTIFICATION_SERVER_URL = process.env.NOTIFICATION_SERVER_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    console.log("Next.js Proxy: Test notification endpoint called");

    try {
        const body = await request.json();

        // Proxy the request to the FastAPI server
        const backendRes = await fetch(`${NOTIFICATION_SERVER_URL}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json();

        if (!backendRes.ok) {
            console.error("Backend error:", data);
            return NextResponse.json(data, { status: backendRes.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Failed to connect to notification server", details: String(error) }, { status: 502 });
    }
}
