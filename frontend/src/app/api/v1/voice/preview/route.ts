import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Gera preview de voz usando ElevenLabs TTS
 */
export async function POST(req: Request) {
    try {
        const { voiceId } = await req.json();
        const apiKey = process.env.ELEVEN_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 });
        }

        if (!voiceId) {
            return NextResponse.json({ error: 'Voice ID é obrigatório' }, { status: 400 });
        }

        const previewText = "Olá! Esta é uma demonstração da minha voz.";

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: previewText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=86400', // Cache por 24h
            },
        });

    } catch (error: any) {
        console.error('[VoicePreview] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
