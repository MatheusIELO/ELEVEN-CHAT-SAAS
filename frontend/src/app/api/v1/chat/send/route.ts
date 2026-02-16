import { NextResponse } from 'next/server';
import { getElevenLabsAgentResponse } from '@/lib/elevenlabs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, message, history, mode, audio } = body;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        console.log(`[ChatRoute] Receiving request. Mode: ${mode}, HasAudio: ${!!audio}`);

        let finalMessage = message;
        let userTranscript = "";

        // Handle Audio Transcription if audio is provided
        if (audio && openaiApiKey) {
            try {
                console.log("[ChatRoute] Starting Transcription...");
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: openaiApiKey });

                const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
                const buffer = Buffer.from(base64Data, 'base64');

                // Use a proper filename/extension so OpenAI knows the format
                const transcription = await openai.audio.transcriptions.create({
                    file: await OpenAI.toFile(buffer, 'audio.webm'),
                    model: "whisper-1",
                });

                finalMessage = transcription.text;
                userTranscript = transcription.text;
                console.log("[ChatRoute] Transcription Success:", finalMessage);
            } catch (err: any) {
                console.error("[ChatRoute] Transcription Error détaillé:", err);
                return NextResponse.json({
                    error: "Erro na transcrição de áudio.",
                    details: err.message,
                    isTranscriptionError: true
                }, { status: 500 });
            }
        }

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        if (!finalMessage && !audio) {
            return NextResponse.json({ error: 'Message or Audio is required' }, { status: 400 });
        }

        const apiKey = process.env.ELEVEN_API_KEY || '';
        if (!apiKey) {
            return NextResponse.json({ error: 'ElevenLabs API Key missing' }, { status: 500 });
        }

        console.log("[ChatRoute] Calling ElevenLabs...");
        const response = await getElevenLabsAgentResponse(agentId, finalMessage || " ", apiKey, mode || 'text', history || []);
        console.log("[ChatRoute] ElevenLabs Success");

        return NextResponse.json({
            text: response.text,
            audioChunks: response.audioChunks,
            userTranscript: userTranscript
        });
    } catch (error: any) {
        console.error('[ChatRoute] Fatal Error:', error);
        return NextResponse.json({
            error: error.message || 'Error processing message',
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
}
