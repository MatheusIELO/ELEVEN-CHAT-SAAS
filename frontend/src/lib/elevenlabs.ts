import WebSocket from 'ws';

export interface AgentResponse {
    text: string;
    conversation_id?: string;
    audioChunks?: string[];
}

export interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

/**
 * getElevenLabsAgentResponse - Conecta via WebSocket ao Agente Conversacional
 * Otimizado para máxima estabilidade em ambientes serverless.
 */
export async function getElevenLabsAgentResponse(
    agentId: string,
    message: string,
    apiKey: string,
    replyMode: 'text' | 'audio' = 'text',
    history: ChatMessage[] = []
): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
        // Parametrizar a URL para evitar cache e garantir nova sessão
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
        console.log(`[ElevenLabs] Iniciando WebSocket: mode=${replyMode}`);

        const ws = new WebSocket(wsUrl, {
            headers: { "xi-api-key": apiKey },
            handshakeTimeout: 10000
        });

        let fullResponse = "";
        let audioChunks: string[] = [];
        let isDone = false;
        let hasSentInput = false;

        // Timeout preventivo para não estourar os 30s do Vercel/Serverless
        const safetyTimeout = setTimeout(() => {
            if (!isDone) {
                console.warn("[ElevenLabs] Timeout atingido. Forçando entrega do que foi capturado.");
                isDone = true;
                ws.close();
                if (fullResponse || audioChunks.length > 0) {
                    resolve({ text: fullResponse.trim() || "Resposta incompleta.", audioChunks });
                } else {
                    reject(new Error("Timeout: O agente não respondeu a tempo."));
                }
            }
        }, 25000);

        ws.on('open', () => {
            console.log("[ElevenLabs] Conexão Aberta");

            // Configuração de início - Fundamental para definir se queremos áudio ou não
            const initiation: any = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: {
                        first_message: " " // Espaço para não disparar fala automática indesejada
                    },
                    tts: {
                        output_format: "mp3_44100_128"
                    }
                }
            };

            // Se o modo for áudio, garantimos que text_only esteja desativado
            if (replyMode === 'audio') {
                initiation.conversation_config_override.conversation = {
                    text_only: false
                };
            } else {
                initiation.conversation_config_override.conversation = {
                    text_only: true
                };
            }

            ws.send(JSON.stringify(initiation));
        });

        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());

                // Metadata recebida -> Hora de enviar a pergunta do usuário
                if (event.type === "conversation_initiation_metadata") {
                    console.log("[ElevenLabs] Metadata OK. Enviando mensagem...");

                    let contextualizedMessage = message;
                    if (history.length > 0) {
                        const historySnippet = history.slice(-3).map(m => `${m.sender === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`).join('\n');
                        contextualizedMessage = `[CONTEXTO ANTERIOR]\n${historySnippet}\n\n[MENSAGEM ATUAL]\n${message}`;
                    }

                    ws.send(JSON.stringify({
                        type: "user_message",
                        text: contextualizedMessage
                    }));
                    hasSentInput = true;
                }

                // Processar resposta de texto (pode vir em partes)
                if (event.agent_response || event.text) {
                    fullResponse += (event.agent_response || event.text || "");
                }
                if (event.type === "agent_chat_response_part") {
                    fullResponse += (event.text_response_part?.text || "");
                }

                // Processar áudio (Chunks de base64)
                if (event.type === "audio_event" && event.audio_event?.audio_base_64) {
                    audioChunks.push(event.audio_event.audio_base_64);
                }

                // Término da resposta do Agente
                if (event.type === "agent_response_end") {
                    console.log(`[ElevenLabs] Sucesso: ${fullResponse.length} chars, ${audioChunks.length} audio chunks.`);
                    isDone = true;
                    clearTimeout(safetyTimeout);
                    ws.close();
                    resolve({ text: fullResponse.trim(), audioChunks });
                }

                // Caso ocorra erro interno no processamento da ElevenLabs
                if (event.type === "internal_error" || event.type === "client_event_error") {
                    const errorMsg = event.error || event.client_event_error?.message || "Erro desconhecido ElevenLabs";
                    console.error("[ElevenLabs] Erro no Evento:", errorMsg);
                    isDone = true;
                    clearTimeout(safetyTimeout);
                    ws.close();
                    reject(new Error(errorMsg));
                }

            } catch (err) {
                // Erros de parsing de frames JSON ruidosos
            }
        });

        ws.on('error', (err) => {
            console.error("[ElevenLabs] WebSocket Error:", err.message);
            if (!isDone) {
                isDone = true;
                clearTimeout(safetyTimeout);
                reject(new Error(`Erro de conexão com ElevenLabs: ${err.message}`));
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`[ElevenLabs] Conexão encerrada (${code}).`);
            if (!isDone) {
                isDone = true;
                clearTimeout(safetyTimeout);
                if (fullResponse || audioChunks.length > 0) {
                    resolve({ text: fullResponse.trim(), audioChunks });
                } else {
                    reject(new Error("Conexão fechada antes de receber resposta. Verifique as chaves e o Agente."));
                }
            }
        });
    });
}
