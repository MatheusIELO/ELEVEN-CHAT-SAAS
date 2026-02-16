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
 * SEMPRE usa text_only para velocidade, e gera áudio separadamente via REST API
 */
export async function getElevenLabsAgentResponse(
    agentId: string,
    message: string,
    apiKey: string,
    replyMode: 'text' | 'audio' = 'text',
    history: ChatMessage[] = []
): Promise<AgentResponse> {
    // SEMPRE pegar texto primeiro (rápido e confiável)
    const textResponse = await getTextResponse(agentId, message, apiKey, history);

    // Se precisar de áudio, gerar via REST API (muito mais rápido que WebSocket)
    if (replyMode === 'audio' && textResponse.text) {
        try {
            const audioChunks = await generateAudioFromText(textResponse.text, apiKey, agentId);
            return { ...textResponse, audioChunks };
        } catch (audioError) {
            console.warn('[ElevenLabs] Erro ao gerar áudio, retornando só texto:', audioError);
            // Retornar texto mesmo se áudio falhar
            return textResponse;
        }
    }

    return textResponse;
}

/**
 * Pega apenas a resposta de TEXTO via WebSocket (rápido - 5-10s)
 */
async function getTextResponse(
    agentId: string,
    message: string,
    apiKey: string,
    history: ChatMessage[]
): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
        console.log(`[ElevenLabs] Abrindo Conexão (text-only mode)`);

        const ws = new WebSocket(wsUrl, {
            headers: { "xi-api-key": apiKey },
            handshakeTimeout: 10000
        });

        let fullResponse = "";
        let isDone = false;

        // Timeout de 30s para texto (mais que suficiente)
        const safetyTimeout = setTimeout(() => {
            if (!isDone) {
                console.warn(`[ElevenLabs] Timeout de texto (30s)`);
                isDone = true;
                ws.terminate();
                if (fullResponse) {
                    resolve({ text: fullResponse.trim() });
                } else {
                    reject(new Error(`Timeout: O agente não respondeu em 30s.`));
                }
            }
        }, 30000);

        ws.on('open', () => {
            console.log("[ElevenLabs] WebSocket Aberto (text-only)");

            const initiation = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: { first_message: " " },
                    conversation: { text_only: true } // SEMPRE text-only
                }
            };

            ws.send(JSON.stringify(initiation));
        });

        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());

                if (event.type === "conversation_initiation_metadata") {
                    console.log("[ElevenLabs] Metadata OK. Enviando Mensagem.");

                    let finalInput = message;
                    if (history.length > 0) {
                        const past = history.slice(-3).map(h => `${h.sender === 'user' ? 'U' : 'A'}: ${h.text}`).join("\n");
                        finalInput = `Contexto:\n${past}\n\nAtual: ${message}`;
                    }

                    ws.send(JSON.stringify({
                        type: "user_message",
                        text: finalInput
                    }));
                }

                // Captura de Texto
                if (event.agent_response || event.text) {
                    fullResponse += (event.agent_response || event.text || "");
                }
                if (event.type === "agent_chat_response_part" && event.text_response_part) {
                    fullResponse += event.text_response_part.text;
                }

                // Fim da resposta
                if (event.type === "agent_response_end") {
                    console.log("[ElevenLabs] Texto recebido com sucesso");
                    isDone = true;
                    clearTimeout(safetyTimeout);
                    ws.close();
                    resolve({ text: fullResponse.trim() });
                }

                // Erros
                if (event.type === "internal_error" || event.type === "client_event_error") {
                    const msg = event.error || "Erro interno ElevenLabs";
                    console.error("[ElevenLabs] Erro:", msg);
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
            console.log(`[ElevenLabs] Conexão Fechada (Código: ${code})`);
            if (!isDone) {
                isDone = true;
                clearTimeout(safetyTimeout);
                if (fullResponse) {
                    resolve({ text: fullResponse.trim() });
                } else {
                    reject(new Error(`Conexão encerrada prematuramente (Código: ${code})`));
                }
            }
        });
    });
}

/**
 * Gera áudio a partir do texto via REST API (muito mais rápido e confiável)
 */
async function generateAudioFromText(
    text: string,
    apiKey: string,
    agentId: string
): Promise<string[]> {
    console.log('[ElevenLabs] Gerando áudio via REST API...');

    // Pegar a voz do agente
    const agentRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: { 'xi-api-key': apiKey }
    });

    if (!agentRes.ok) {
        throw new Error('Falha ao buscar configuração do agente');
    }

    const agentData = await agentRes.json();
    const voiceId = agentData.conversation_config?.tts?.voice_id || '21m00Tcm4TlvDq8ikWAM';

    // Gerar áudio com a voz do agente
    const audioRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2', // Melhor para PT-BR
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!audioRes.ok) {
        throw new Error('Falha ao gerar áudio');
    }

    const audioBuffer = await audioRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log('[ElevenLabs] Áudio gerado com sucesso via REST');
    return [base64Audio];
}
