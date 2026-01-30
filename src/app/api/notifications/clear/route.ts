import { NextResponse } from "next/server";

const NOTIFICATION_SERVER_URL = process.env.NOTIFICATION_SERVER_URL || 'http://localhost:8000';

export async function POST() {
    console.log("Next.js Proxy: Clear subscriptions called");

    try {
        const backendRes = await fetch(`${NOTIFICATION_SERVER_URL}/subscriptions/clear`, {
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
        return NextResponse.json({ error: "Failed to connect to notification server", details: String(error) }, { status: 502 });
    }
}
