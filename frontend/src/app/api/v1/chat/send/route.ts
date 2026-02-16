import { NextResponse } from 'next/server';
import { getElevenLabsAgentResponse, generateSpeech } from '@/lib/elevenlabs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, message, history, mode, audio } = body;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        console.log(`[ChatRoute] Request: AgentId=${agentId}, Mode=${mode}, AudioInput=${!!audio}`);

        let finalMessage = message;
        let userTranscript = "";
        let transcriptionError = null;

        // 1. Transcribe Audio (if provided)
        if (audio && openaiApiKey) {
            try {
                console.log("[ChatRoute] Transcribing with OpenAI...");
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: openaiApiKey });

                // Check for base64 header
                const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
                const buffer = Buffer.from(base64Data, 'base64');

                const transcription = await openai.audio.transcriptions.create({
                    file: await OpenAI.toFile(buffer, 'audio.webm'),
                    model: "whisper-1",
                });

                finalMessage = transcription.text;
                userTranscript = transcription.text;
                console.log(`[ChatRoute] Transcript: "${finalMessage}"`);
            } catch (err: any) {
                console.error("[ChatRoute] Transcription Failed:", err);
                transcriptionError = err.message;
                // If transcription fails, we cannot proceed with a meaningful voice query
                return NextResponse.json({
                    error: "Falha na transcrição do áudio",
                    details: err.message
                }, { status: 400 });
            }
        }

        if (!finalMessage && !audio) {
            return NextResponse.json({ error: 'Nenhuma mensagem ou áudio fornecido.' }, { status: 400 });
        }

        const apiKey = process.env.ELEVEN_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Chave API ElevenLabs não configurada.' }, { status: 500 });
        }

        // 2. Get Response from ElevenLabs Conversational AI
        try {
            console.log(`[ChatRoute] Connecting to ElevenLabs Agent ${agentId}...`);
            const response = await getElevenLabsAgentResponse(agentId, finalMessage || " ", apiKey, mode || 'text', history || []);

            console.log(`[ChatRoute] ElevenLabs Response: TextLen=${response.text.length}, AudioChunks=${response.audioChunks?.length || 0}`);

            // Fallback: If mode is audio but no audio chunks received (and text exists), ensure we have audio
            // This handles cases where WS might have negotiated text-only or failed to stream audio
            if (mode === 'audio' && (!response.audioChunks || response.audioChunks.length === 0) && response.text) {
                console.log("[ChatRoute] Warning: No audio chunks from WS. Generating fallback TTS.");
                /* 
                   Optional: Use standard TTS if connection was text-only or dropped audio.
                   Note: We'd need a voice ID. Since we don't have the agent's voice ID easily available here 
                   without another lookup, we might skip this or use a default.
                   For now, we will return what we have, but log strictly.
                */
            }

            return NextResponse.json({
                text: response.text,
                audioChunks: response.audioChunks || [],
                userTranscript: userTranscript
            });

        } catch (elevenError: any) {
            console.error("[ChatRoute] ElevenLabs Error:", elevenError);
            return NextResponse.json({
                error: "Erro na comunicação com ElevenLabs",
                details: elevenError.message,
                stack: elevenError.stack
            }, { status: 502 }); // 502 Bad Gateway is appropriate here
        }

    } catch (fatalError: any) {
        console.error('[ChatRoute] Fatal System Error:', fatalError);
        return NextResponse.json({
            error: "Erro Interno do Servidor",
            details: fatalError.message
        }, { status: 500 });
    }
}
