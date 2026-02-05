import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: "online",
        backend: "Next.js API Routes",
        elevenlabs_configured: !!process.env.ELEVEN_API_KEY,
        firebase_configured: !!process.env.FIREBASE_SERVICE_ACCOUNT
    });
}
