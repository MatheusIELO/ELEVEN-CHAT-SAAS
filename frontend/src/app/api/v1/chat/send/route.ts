import { NextResponse } from 'next/server';
import { getElevenLabsAgentResponse } from '@/lib/elevenlabs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, message, history, mode, audio } = body;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        let finalMessage = message;
        let userTranscript = "";

        // Handle Audio Transcription if audio is provided
        if (audio && openaiApiKey) {
            try {
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: openaiApiKey });

                const buffer = Buffer.from(audio.split(',')[1] || audio, 'base64');
                const transcription = await openai.audio.transcriptions.create({
                    file: await OpenAI.toFile(buffer, 'audio.webm'),
                    model: "whisper-1",
                });

                finalMessage = transcription.text;
                userTranscript = transcription.text;
                console.log("Transcrição concluída:", finalMessage);
            } catch (err) {
                console.error("Transcription Error détaillée:", err);
                // Fallback to original message if transcription fails
            }
        }

        if (!agentId || (!finalMessage && !audio)) {
            return NextResponse.json({ error: 'Agent ID and Message/Audio are required' }, { status: 400 });
        }

        const apiKey = process.env.ELEVEN_API_KEY || '';
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const response = await getElevenLabsAgentResponse(agentId, finalMessage || " ", apiKey, mode || 'text', history || []);

        return NextResponse.json({
            text: response.text,
            audioChunks: response.audioChunks,
            userTranscript: userTranscript
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
