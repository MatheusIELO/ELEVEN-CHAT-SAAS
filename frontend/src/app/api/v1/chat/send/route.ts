import { NextResponse } from 'next/server';
import { getElevenLabsAgentResponse } from '@/lib/elevenlabs';
import { setPendingResponse } from '@/lib/async-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, message, history, mode, audio } = body;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        console.log(`[ChatRoute] Request: AgentId=${agentId}, Mode=${mode}, AudioInput=${!!audio}`);

        let finalMessage = message;
        let userTranscript = "";

        // 1. Transcrever Áudio se fornecido
        if (audio && openaiApiKey) {
            try {
                console.log("[ChatRoute] Transcrevendo com OpenAI Whisper...");
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: openaiApiKey });

                const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
                const buffer = Buffer.from(base64Data, 'base64');

                const transcription = await openai.audio.transcriptions.create({
                    file: await OpenAI.toFile(buffer, 'audio.webm'),
                    model: "whisper-1",
                    language: "pt",
                });

                finalMessage = transcription.text;
                userTranscript = transcription.text;
                console.log(`[ChatRoute] Transcrição: "${finalMessage}"`);
            } catch (err: any) {
                console.error("[ChatRoute] Erro na Transcrição:", err);
                return NextResponse.json({
                    error: "Falha na transcrição do seu áudio.",
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

        // 2. Se for áudio, processar de forma ASSÍNCRONA
        if (mode === 'audio') {
            const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Marcar como "processando"
            setPendingResponse(requestId, {
                status: 'processing',
                userTranscript
            });

            // Processar em background (não esperar)
            (async () => {
                try {
                    console.log(`[ChatRoute] Iniciando processamento assíncrono: ${requestId}`);
                    const response = await getElevenLabsAgentResponse(agentId, finalMessage || " ", apiKey, 'audio', history || []);

                    setPendingResponse(requestId, {
                        status: 'completed',
                        text: response.text,
                        audioChunks: response.audioChunks || [],
                        userTranscript
                    });
                    console.log(`[ChatRoute] Processamento concluído: ${requestId}`);
                } catch (error: any) {
                    console.error(`[ChatRoute] Erro no processamento assíncrono: ${requestId}`, error);
                    setPendingResponse(requestId, {
                        status: 'error',
                        error: error.message,
                        userTranscript
                    });
                }
            })();

            // Retornar imediatamente com o ID da requisição
            return NextResponse.json({
                requestId,
                status: 'processing',
                userTranscript,
                message: 'Processando sua mensagem de áudio...'
            });
        }

        // 3. Se for texto, processar SÍNCRONAMENTE (rápido)
        try {
            console.log(`[ChatRoute] Conectando ao Agente ${agentId}...`);
            const response = await getElevenLabsAgentResponse(agentId, finalMessage || " ", apiKey, mode || 'text', history || []);

            console.log(`[ChatRoute] Resposta ElevenLabs: Texto=${response.text.length} chars`);

            return NextResponse.json({
                text: response.text,
                audioChunks: [],
                userTranscript: userTranscript
            });

        } catch (elevenError: any) {
            console.error("[ChatRoute] Erro na ElevenLabs:", elevenError);
            return NextResponse.json({
                error: "A ElevenLabs demorou a responder ou a conexão falhou.",
                details: elevenError.message
            }, { status: 502 });
        }

    } catch (fatalError: any) {
        console.error('[ChatRoute] Erro Fatal:', fatalError);
        return NextResponse.json({
            error: "Erro Interno no Servidor.",
            details: fatalError.message
        }, { status: 500 });
    }
}
