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

export async function generateSpeech(text: string, voiceId: string, apiKey: string, modelId: string = "eleven_flash_v2_5"): Promise<Buffer> {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
    });
    if (!response.ok) throw new Error(`TTS Error: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function getElevenLabsAgentResponse(
    agentId: string,
    message: string,
    apiKey: string,
    replyMode: 'text' | 'audio' = 'text',
    history: ChatMessage[] = []
): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
        const ws = new WebSocket(wsUrl, { headers: { "xi-api-key": apiKey } });

        let fullResponse = "";
        let audioChunks: string[] = [];
        let isDone = false;
        let hasSentInput = false;

        const timeout = setTimeout(() => {
            if (!isDone) {
                ws.close();
                if (fullResponse) resolve({ text: fullResponse.trim() });
                else reject(new Error("ElevenLabs Timeout"));
            }
        }, 15000);

        ws.on('open', () => {
            const initiation = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: {
                        first_message: " "
                    },
                    conversation: { text_only: replyMode === 'text' }
                }
            };
            ws.send(JSON.stringify(initiation));
        });

        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());

                if (event.type === "conversation_initiation_metadata") {
                    // Combine history and current message into one cohesive input
                    // This is a workaround since we can't seed history easily in WS
                    let contextualizedMessage = message;
                    if (history.length > 0) {
                        const historyText = history.map(m => `${m.sender === 'user' ? 'Usuário' : 'Bot'}: ${m.text}`).join('\n');
                        contextualizedMessage = `### CONTEXTO DE CONTINUIDADE ###\n` +
                            `HISTÓRICO RECENTE:\n${historyText}\n\n` +
                            `### INSTRUÇÃO OBRIGATÓRIA PARA ESTA RESPOSTA ###\n` +
                            `O cliente disse agora: "${message}"\n` +
                            `1. IGNORE SAUDAÇÕES: Não diga "Olá", "Oi", "Tudo bem", "E aí" ou similares. Vá direto à resposta.\n` +
                            `2. ZERO GÍRIAS: Seja cordial e educado. Nunca use gírias.\n` +
                            `3. FOCO: Responda apenas à pergunta ou comentário atual do cliente de forma natural.`;
                    }

                    ws.send(JSON.stringify({
                        type: "user_message",
                        text: contextualizedMessage
                    }));
                    hasSentInput = true;
                }

                if (event.type === "agent_response" && hasSentInput) {
                    fullResponse += event.agent_response || event.text || "";
                }

                if (event.type === "agent_chat_response_part" && hasSentInput) {
                    const chunk = event.text_response_part?.text || "";
                    fullResponse += chunk;
                    if (event.text_response_part?.type === "end") {
                        isDone = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve({ text: fullResponse.trim() });
                    }
                }

                if (event.type === "agent_response_end") {
                    if (hasSentInput && fullResponse.trim().length > 0) {
                        isDone = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve({ text: fullResponse.trim(), audioChunks });
                    }
                }

                if (event.type === "audio_event") {
                    if (event.audio_event?.audio_base_64) {
                        audioChunks.push(event.audio_event.audio_base_64);
                    }
                }

                if (event.type === "internal_error") {
                    reject(new Error(event.error));
                }
            } catch (err) { }
        });

        ws.on('error', (err) => {
            if (!isDone) reject(err);
        });

        ws.on('close', () => {
            if (!isDone && fullResponse) {
                isDone = true;
                resolve({ text: fullResponse.trim() });
            }
        });
    });
}
