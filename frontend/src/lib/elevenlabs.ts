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
        console.log(`[ElevenLabs] Conectando: ${wsUrl}`);
        const ws = new WebSocket(wsUrl, { headers: { "xi-api-key": apiKey } });

        let fullResponse = "";
        let audioChunks: string[] = [];
        let isDone = false;
        let hasSentInput = false;

        // Aumentado timeout para 45s para garantir que áudios longos terminem
        const timeout = setTimeout(() => {
            if (!isDone) {
                console.warn("[ElevenLabs] Timeout de 45s atingido.");
                ws.close();
                if (fullResponse || audioChunks.length > 0) {
                    isDone = true;
                    resolve({ text: fullResponse.trim(), audioChunks });
                } else {
                    reject(new Error("A ElevenLabs não respondeu a tempo (Timeout)."));
                }
            }
        }, 45000);

        ws.on('open', () => {
            console.log("[ElevenLabs] WebSocket Conectado");
            const initiation = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: {
                        first_message: " "
                    }
                }
            };

            if (replyMode === 'audio') {
                // Deixando o Agente gerenciar sua própria TTS para máxima estabilidade
            } else {
                (initiation.conversation_config_override as any).conversation = {
                    text_only: true
                };
            }

            ws.send(JSON.stringify(initiation));
        });

        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());
                // console.log(`[ElevenLabs] Evento: ${event.type}`); // Muito ruidoso se deixar ativo

                if (event.type === "conversation_initiation_metadata") {
                    let contextualizedMessage = message;

                    if (history.length > 0) {
                        const historyText = history.slice(-5).map(m => `${m.sender === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`).join('\n');
                        contextualizedMessage = `[CONTEXTO]\n${historyText}\n\n[MENSAGEM ATUAL]\n${message}`;
                    }

                    ws.send(JSON.stringify({
                        type: "user_message",
                        text: contextualizedMessage
                    }));
                    hasSentInput = true;
                    console.log("[ElevenLabs] Mensagem enviada ao Agente.");
                }

                // Captura texto de várias formas para garantir compatibilidade
                if (event.agent_response || event.text) {
                    fullResponse += (event.agent_response || event.text || "");
                }

                if (event.type === "agent_chat_response_part") {
                    fullResponse += (event.text_response_part?.text || "");
                }

                if (event.type === "audio_event" && event.audio_event?.audio_base_64) {
                    audioChunks.push(event.audio_event.audio_base_64);
                }

                if (event.type === "agent_response_end") {
                    console.log("[ElevenLabs] Fim da resposta detectado.");
                    isDone = true;
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ text: fullResponse.trim(), audioChunks });
                }

                if (event.type === "internal_error" || event.type === "client_event_error") {
                    const errMsg = event.error || event.client_event_error?.message || "Erro interno ElevenLabs";
                    console.error("[ElevenLabs] Erro reportado pelo WS:", errMsg);
                    reject(new Error(errMsg));
                }

            } catch (err) {
                // Erro de parse JSON silenciado
            }
        });

        ws.on('error', (err) => {
            console.error("[ElevenLabs] Erro de Socket:", err);
            if (!isDone) reject(new Error(`Falha na conexão: ${err.message}`));
        });

        ws.on('close', (code, reason) => {
            console.log(`[ElevenLabs] Conexão fechada (${code})`);
            if (!isDone) {
                if (fullResponse || audioChunks.length > 0) {
                    isDone = true;
                    clearTimeout(timeout);
                    resolve({ text: fullResponse.trim(), audioChunks });
                } else {
                    reject(new Error("Conexão interrompida antes da resposta."));
                }
            }
        });
    });
}
