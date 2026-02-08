import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        status: "online",
        firebase_connected: !!db,
        elevenlabs_configured: !!process.env.ELEVEN_API_KEY && process.env.ELEVEN_API_KEY !== 'INSIRA_SUA_CHAVE_AQUI'
    });
}
