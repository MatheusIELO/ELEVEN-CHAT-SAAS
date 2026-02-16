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
                console.warn("[ElevenLabs] Timeout (30s) atingido - Fechando conexão.");
                ws.close();
                if (fullResponse) resolve({ text: fullResponse.trim(), audioChunks });
                else reject(new Error("Timeout: Sem resposta do Agente ElevenLabs após 30s."));
            }
        }, 30000);

        ws.on('open', () => {
            console.log("[ElevenLabs] WebSocket Aberto para Agente:", agentId);
            const initiation = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: {
                        first_message: " " // Force initial message as empty to trigger conversation
                    }
                }
            };

            // Configurar áudio se necessário
            if (replyMode === 'audio') {
                (initiation.conversation_config_override as any).tts = {
                    voice_id: undefined, // Let agent decide voice, unless passed explicitly
                    output_format: "mp3_44100_128" // Ensure standard MP3 format
                };
            } else {
                // Ensure text-only 
                (initiation.conversation_config_override as any).conversation = {
                    text_only: true
                };
            }

            ws.send(JSON.stringify(initiation));
        });

        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());

                if (event.type === "conversation_initiation_metadata") {
                    console.log("[ElevenLabs] Metadata: Conversa pode iniciar.");
                    let contextualizedMessage = message;

                    // Limit history to preserve context but respect token limits
                    if (history.length > 0) {
                        const historyText = history.slice(-5).map(m => `${m.sender === 'user' ? 'Usuário: ' : 'Bot: '}${m.text}`).join('\n');
                        contextualizedMessage = `### CONTEXTO DA CONVERSA ###\n${historyText}\n\n### MENSAGEM ATUAL ###\nO cliente disse: "${message}"`;
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
                }

                if (event.type === "audio_event") {
                    // Check specifically for 'audio_base_64'
                    if (event.audio_event?.audio_base_64) {
                        audioChunks.push(event.audio_event.audio_base_64);
                    }
                }

                if (event.type === "agent_response_end") {
                    console.log(`[ElevenLabs] Fim da Resposta. Len=${fullResponse.length}, Chunks=${audioChunks.length}`);
                    isDone = true;
                    // Close gracefully
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ text: fullResponse.trim(), audioChunks });
                }

                if (event.type === "internal_error") {
                    console.error("[ElevenLabs] Erro Interno:", event.error);
                    reject(new Error(`ElevenLabs Error: ${event.error}`));
                }

                if (event.type === "client_event_error") {
                    console.error("[ElevenLabs] Erro de Cliente:", event.client_event_error);
                    reject(new Error(`ElevenLabs Client Error: ${JSON.stringify(event.client_event_error)}`));
                }

            } catch (err) {
                console.error("[ElevenLabs] Erro ao processar mensagem JSON:", err);
            }
        });

        ws.on('error', (err) => {
            console.error("[ElevenLabs] Erro de Socket:", err);
            if (!isDone) reject(new Error(`ElevenLabs WebSocket Error: ${err.message}`));
        });

        ws.on('close', (code, reason) => {
            console.log(`[ElevenLabs] WS Fechado (Code: ${code}, Reason: ${reason})`);
            if (!isDone && (fullResponse || audioChunks.length > 0)) {
                isDone = true;
                resolve({ text: fullResponse.trim(), audioChunks });
            } else if (!isDone) {
                // If closed without response
                reject(new Error("Conexão fechada prematuramente pela ElevenLabs. Verifique se o Agente está ativo e configurado."));
            }
        });
    });
}
