import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

/**
 * Endpoint de streaming para respostas de texto
 * Retorna Server-Sent Events (SSE) para mostrar texto conforme é gerado
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, message, history } = body;
        const apiKey = process.env.ELEVEN_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 });
        }

        console.log(`[StreamRoute] Iniciando streaming para agente ${agentId}`);

        // Criar stream de resposta
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Conectar ao WebSocket da ElevenLabs
                    const WebSocket = (await import('ws')).default;
                    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;

                    const ws = new WebSocket(wsUrl, {
                        headers: { "xi-api-key": apiKey },
                        handshakeTimeout: 10000
                    });

                    let isInitialized = false;

                    ws.on('open', () => {
                        console.log('[StreamRoute] WebSocket aberto');

                        const initiation = {
                            type: "conversation_initiation_client_data",
                            conversation_config_override: {
                                agent: { first_message: " " },
                                conversation: { text_only: true }
                            }
                        };

                        ws.send(JSON.stringify(initiation));
                    });

                    ws.on('message', (data) => {
                        try {
                            const event = JSON.parse(data.toString());

                            if (event.type === "conversation_initiation_metadata") {
                                console.log('[StreamRoute] Enviando mensagem do usuário');

                                let finalInput = message;
                                if (history && history.length > 0) {
                                    const last3 = history.slice(-3);
                                    const historyText = last3.map((m: any) =>
                                        `${m.sender === 'user' ? 'Usuário' : 'Você'}: ${m.text}`
                                    ).join('\n');
                                    finalInput = `Histórico recente:\n${historyText}\n\nUsuário: ${message}`;
                                }

                                ws.send(JSON.stringify({
                                    type: "user_message",
                                    message: finalInput
                                }));

                                isInitialized = true;
                            }

                            // Enviar chunks de texto conforme chegam
                            if (event.type === "agent_response" && event.text) {
                                const chunk = `data: ${JSON.stringify({ text: event.text })}\n\n`;
                                controller.enqueue(encoder.encode(chunk));
                            }

                            // Finalizar quando receber resposta completa
                            if (event.type === "agent_response_complete") {
                                console.log('[StreamRoute] Resposta completa');
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                ws.close();
                                controller.close();
                            }

                        } catch (err) {
                            console.error('[StreamRoute] Erro ao processar mensagem:', err);
                        }
                    });

                    ws.on('error', (error) => {
                        console.error('[StreamRoute] WebSocket error:', error);
                        controller.error(error);
                    });

                    ws.on('close', (code) => {
                        console.log(`[StreamRoute] WebSocket fechado: ${code}`);
                        if (!controller.desiredSize) return; // Já foi fechado
                        controller.close();
                    });

                    // Timeout de segurança
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            console.warn('[StreamRoute] Timeout de 30s');
                            ws.close();
                            controller.close();
                        }
                    }, 30000);

                } catch (error: any) {
                    console.error('[StreamRoute] Erro:', error);
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('[StreamRoute] Erro fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
