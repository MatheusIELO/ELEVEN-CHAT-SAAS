/**
 * ElevenLabs Conversational AI Bridge
 * Handles text-to-text communication with ElevenLabs Agents
 */

export interface AgentResponse {
    text: string;
    conversation_id?: string;
    audioChunks?: string[]; // Array of base64 audio chunks
}


/**
 * Generates speech (MP3) from text using ElevenLabs TTS API.
 * This is used for sending audio responses to WhatsApp, as WS API does not output MP3.
 */
export async function generateSpeech(
    text: string,
    voiceId: string,
    apiKey: string,
    modelId: string = "eleven_flash_v2_5"
): Promise<Buffer> {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    // ElevenLabs requires specific headers for streaming/audio response
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ElevenLabs TTS Error: ${JSON.stringify(errorData)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Sends a text message to an ElevenLabs Agent and waits for the response.
 * Uses WebSockets under the hood for real-time ConvAI interaction.
 */
export async function getElevenLabsAgentResponse(
    agentId: string,
    message: string,
    apiKey: string,
    replyMode: 'text' | 'audio' = 'text'
): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;

        const ws = new WebSocket(wsUrl, {
            headers: {
                "xi-api-key": apiKey
            }
        } as any);

        let fullResponse = "";
        const audioChunks: string[] = [];
        let isDone = false;

        const timeout = setTimeout(() => {
            if (!isDone) {
                ws.close();
                reject(new Error("ElevenLabs timeout after 15s"));
            }
        }, 15000);

        ws.onopen = () => {
            const startMsg = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: {
                        prompt: { override: true },
                        first_message: { override: true }
                    },
                    tts: {
                        mode: replyMode === 'audio' ? 'default' : 'off' // Turn off TTS if text-only requested to save latency/cost? 
                        // Actually, 'tts' config in init packet might not be supported this way.
                        // But we can just ignore audio if text-only.
                    }
                }
            };
            ws.send(JSON.stringify(startMsg));

            const userMsg = {
                type: "user_input",
                input: message,
            };
            ws.send(JSON.stringify(userMsg));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);

                if (data.type === "agent_response") {
                    fullResponse += data.agent_response;
                }

                if (data.type === "audio" && replyMode === 'audio') {
                    if (data.audio_event?.audio_base_64) {
                        audioChunks.push(data.audio_event.audio_base_64);
                    }
                }

                if (data.type === "agent_response_end" || data.type === "conversation_end") {
                    isDone = true;
                    clearTimeout(timeout);
                    ws.close();
                    resolve({
                        text: fullResponse,
                        audioChunks: replyMode === 'audio' ? audioChunks : undefined
                    });
                }
            } catch (err) {
                console.error("WS Parse Error:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("ElevenLabs WS Error:", err);
            clearTimeout(timeout);
            reject(err);
        };

        ws.onclose = () => {
            if (!isDone && fullResponse) {
                isDone = true;
                clearTimeout(timeout);
                resolve({
                    text: fullResponse,
                    audioChunks: replyMode === 'audio' ? audioChunks : undefined
                });
            }
        };
    });
}
