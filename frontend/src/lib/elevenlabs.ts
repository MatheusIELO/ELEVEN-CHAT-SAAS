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
 * Otimizado para máxima estabilidade e velocidade em ambientes serverless.
 */
export async function getElevenLabsAgentResponse(
    agentId: string,
    message: string,
    apiKey: string,
    replyMode: 'text' | 'audio' = 'text',
    history: ChatMessage[] = []
): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
        console.log(`[ElevenLabs] Abrindo Conexão: mode=${replyMode}`);

        const ws = new WebSocket(wsUrl, {
            headers: { "xi-api-key": apiKey },
            handshakeTimeout: 10000 // 10s para handshake
        });

        let fullResponse = "";
        let audioChunks: string[] = [];
        let isDone = false;
        let hasSentInput = false;

        // Limite de segurança total (28s) - Próximo do limite do Vercel (30s)
        const safetyTimeout = setTimeout(() => {
            if (!isDone) {
                console.warn("[ElevenLabs] Timeout Crítico (28s). Finalizando conexão.");
                isDone = true;
                ws.terminate(); // Terminate é mais agressivo que close()
                if (fullResponse || audioChunks.length > 0) {
                    resolve({ text: fullResponse.trim() || "Resposta parcial por tempo limite.", audioChunks });
                } else {
                    reject(new Error("A ElevenLabs não respondeu a tempo (Timeout de 28s)."));
                }
            }
        }, 28000);

        ws.on('open', () => {
            console.log("[ElevenLabs] WebSocket Aberto.");

            const initiation = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: { first_message: " " },
                    tts: { output_format: "mp3_44100_128" },
                    conversation: { text_only: replyMode === 'text' }
                }
            };

            ws.send(JSON.stringify(initiation));
        });

        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());

                // Se houver erro da API antes de começar
                if (event.type === "conversation_initiation_metadata") {
                    console.log("[ElevenLabs] Metadata OK. Enviando Mensagem.");

                    // Formatar histórico para o contexto (opcional mas recomendado)
                    let finalInput = message;
                    if (history.length > 0) {
                        const past = history.slice(-5).map(h => `${h.sender === 'user' ? 'User' : 'Agent'}: ${h.text}`).join("\n");
                        finalInput = `Histórico:\n${past}\n\nMensagem Atual: ${message}`;
                    }

                    ws.send(JSON.stringify({
                        type: "user_message",
                        text: finalInput
                    }));
                    hasSentInput = true;
                }

                // Captura de Texto
                if (event.agent_response || event.text) {
                    fullResponse += (event.agent_response || event.text || "");
                }
                if (event.type === "agent_chat_response_part" && event.text_response_part) {
                    fullResponse += event.text_response_part.text;
                }

                // Captura de Áudio
                if (event.type === "audio_event" && event.audio_event?.audio_base_64) {
                    audioChunks.push(event.audio_event.audio_base_64);
                }

                // Fim da resposta
                if (event.type === "agent_response_end") {
                    console.log("[ElevenLabs] Resposta concluída com sucesso.");
                    isDone = true;
                    clearTimeout(safetyTimeout);
                    ws.close();
                    resolve({ text: fullResponse.trim(), audioChunks });
                }

                // Erros de Processamento
                if (event.type === "internal_error" || event.type === "client_event_error") {
                    const msg = event.error || "Erro interno ElevenLabs";
                    console.error("[ElevenLabs] Erro Identificado:", msg);
                    isDone = true;
                    clearTimeout(safetyTimeout);
                    ws.close();
                    reject(new Error(msg));
                }

            } catch (err) {
                // Frames ruidosos
            }
        });

        ws.on('error', (err) => {
            console.error("[ElevenLabs] Erro de WebSocket:", err.message);
            if (!isDone) {
                isDone = true;
                clearTimeout(safetyTimeout);
                reject(new Error(`Erro de Conexão: ${err.message}`));
            }
        });

        ws.on('close', (code) => {
            console.log(`[ElevenLabs] Conexão Fechada (Código: ${code}).`);
            if (!isDone) {
                isDone = true;
                clearTimeout(safetyTimeout);
                if (fullResponse) {
                    resolve({ text: fullResponse.trim(), audioChunks });
                } else {
                    reject(new Error(`A conexão foi encerrada prematuramente (Código: ${code}).`));
                }
            }
        });
    });
}
