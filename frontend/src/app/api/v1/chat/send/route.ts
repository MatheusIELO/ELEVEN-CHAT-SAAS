import { NextResponse } from 'next/server';
import { getElevenLabsAgentResponse } from '@/lib/elevenlabs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos com Fluid Compute (Hobby plan)
export const runtime = 'nodejs'; // Necessário para Fluid Compute

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, message, history, mode, audio } = body;

        console.log(`[ChatRoute] Request: AgentId=${agentId}, Mode=${mode}, AudioInput=${!!audio}`);

        let finalMessage = message || "";
        let userTranscript = "";

        // Se for mensagem de texto, processar normalmente
        if (!audio && message) {
            const apiKey = process.env.ELEVEN_API_KEY;
            if (!apiKey) {
                return NextResponse.json({ error: 'Chave API ElevenLabs não configurada.' }, { status: 500 });
            }

            try {
                console.log(`[ChatRoute] Processando mensagem de texto...`);
                const response = await getElevenLabsAgentResponse(
                    agentId,
                    finalMessage,
                    apiKey,
                    'text',
                    history || []
                );

                return NextResponse.json({
                    text: response.text,
                    audioChunks: response.audioChunks || [],
                    userTranscript: finalMessage
                });
            } catch (error: any) {
                console.error("[ChatRoute] Erro ao processar texto:", error);
                return NextResponse.json({
                    error: "Erro ao processar mensagem.",
                    details: error.message
                }, { status: 500 });
            }
        }

        // Se for áudio, usar Whisper para transcrever primeiro
        if (audio) {
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
                return NextResponse.json({
                    error: 'Transcrição de áudio não disponível.',
                    details: 'OpenAI API key não configurada'
                }, { status: 500 });
            }

            try {
                console.log("[ChatRoute] Transcrevendo áudio com Whisper...");
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: openaiApiKey });

                // Extrair base64
                const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
                const buffer = Buffer.from(base64Data, 'base64');
                console.log(`[ChatRoute] Buffer criado: ${buffer.length} bytes`);

                // Transcrever
                const transcription = await openai.audio.transcriptions.create({
                    file: await OpenAI.toFile(buffer, 'audio.webm'),
                    model: "whisper-1",
                    language: "pt",
                });

                finalMessage = transcription.text || "";
                userTranscript = transcription.text || "";
                console.log(`[ChatRoute] Transcrição: "${finalMessage}"`);

                if (!finalMessage.trim()) {
                    console.warn("[ChatRoute] Transcrição vazia");
                    return NextResponse.json({
                        text: "Não consegui entender o áudio. Pode repetir?",
                        audioChunks: [],
                        userTranscript: "[áudio não compreendido]"
                    });
                }

                // Processar com ElevenLabs
                const apiKey = process.env.ELEVEN_API_KEY;
                if (!apiKey) {
                    return NextResponse.json({ error: 'Chave API ElevenLabs não configurada.' }, { status: 500 });
                }

                console.log(`[ChatRoute] Processando com ElevenLabs...`);
                const response = await getElevenLabsAgentResponse(
                    agentId,
                    finalMessage,
                    apiKey,
                    'audio',
                    history || []
                );

                return NextResponse.json({
                    text: response.text,
                    audioChunks: response.audioChunks || [],
                    userTranscript: userTranscript
                });

            } catch (error: any) {
                console.error("[ChatRoute] Erro no processamento de áudio:", error);
                console.error("[ChatRoute] Stack:", error.stack);
                return NextResponse.json({
                    error: "Erro ao processar áudio.",
                    details: error.message
                }, { status: 400 });
            }
        }

        return NextResponse.json({
            error: 'Nenhuma mensagem ou áudio fornecido.'
        }, { status: 400 });

    } catch (fatalError: any) {
        console.error('[ChatRoute] Erro Fatal:', fatalError);
        return NextResponse.json({
            error: "Erro Interno no Servidor.",
            details: fatalError.message
        }, { status: 500 });
    }
}
