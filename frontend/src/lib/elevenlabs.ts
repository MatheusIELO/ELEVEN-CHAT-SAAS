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

        // Timeout dinâmico: texto é rápido, áudio precisa de mais tempo
        // Com Fluid Compute, podemos usar até 5 minutos (300s)
        const timeoutDuration = replyMode === 'audio' ? 240000 : 30000; // 4min para áudio, 30s para texto
        console.log(`[ElevenLabs] Timeout configurado: ${timeoutDuration}ms para modo ${replyMode}`);

        const safetyTimeout = setTimeout(() => {
            if (!isDone) {
                console.warn(`[ElevenLabs] Timeout (${timeoutDuration}ms) atingido no modo ${replyMode}.`);
                isDone = true;
                ws.terminate();
                if (fullResponse || audioChunks.length > 0) {
                    resolve({ text: fullResponse.trim() || "Resposta parcial.", audioChunks });
                } else {
                    reject(new Error(`Timeout: O agente não respondeu em ${timeoutDuration / 1000}s.`));
                }
            }
        }, timeoutDuration);

        ws.on('open', () => {
            console.log("[ElevenLabs] WebSocket Aberto.");

            const initiation = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: { first_message: " " },
                    tts: { output_format: "mp3_22050_32" },
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

                    // Contexto mínimo para velocidade máxima
                    let finalInput = message;
                    if (history.length > 0) {
                        const past = history.slice(-3).map(h => `${h.sender === 'user' ? 'U' : 'A'}: ${h.text}`).join("\n");
                        finalInput = `Contexto:\n${past}\n\nAtual: ${message}`;
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
