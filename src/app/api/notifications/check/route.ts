import { NextResponse } from "next/server";
import { checkAndSendNotifications } from "@/lib/notificationService";

export const dynamic = 'force-dynamic';

export async function GET() {
    const result = await checkAndSendNotifications();

    if (!result.success && result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
}
