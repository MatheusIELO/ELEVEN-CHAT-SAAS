import { NextResponse } from 'next/server';
import { getElevenLabsAgentResponse } from '@/lib/elevenlabs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, message, history, mode } = body;

        if (!agentId || !message) {
            return NextResponse.json({ error: 'Agent ID and Message are required' }, { status: 400 });
        }

        const apiKey = process.env.ELEVEN_API_KEY || '';
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const response = await getElevenLabsAgentResponse(agentId, message, apiKey, mode || 'text', history || []);

        return NextResponse.json({
            text: response.text,
            audioChunks: response.audioChunks
        });
    } catch (error: any) {
        console.error('Chat Error:', error);
        return NextResponse.json({
            error: error.message || 'Error processing message',
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
}
