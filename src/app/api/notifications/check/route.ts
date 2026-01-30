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

const NOTIFICATION_SERVER_URL = process.env.NOTIFICATION_SERVER_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Next.js Proxy: Trigger notification cycle called");

    try {
        const backendRes = await fetch(`${NOTIFICATION_SERVER_URL}/trigger`, {
            method: 'POST',
        });

        const data = await backendRes.json();

        if (!backendRes.ok) {
            console.error("Backend error:", data);
            return NextResponse.json(data, { status: backendRes.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Failed to connection to notification server", details: String(error) }, { status: 502 });
    }
}
