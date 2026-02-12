/**
 * ElevenLabs Conversational AI Bridge
 * Handles text-to-text communication with ElevenLabs Agents
 */
import WebSocket from 'ws';

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
        });

        let fullResponse = "";
        const audioChunks: string[] = [];
        let isDone = false;
        let hasSentInput = false;
        let isWaitingForGreetingEnd = false;

        const timeout = setTimeout(() => {
            if (!isDone) {
                console.log("[ElevenLabs WS] Timeout Triggered. Full Response so far:", fullResponse);
                ws.close();
                if (fullResponse) {
                    resolve({ text: fullResponse });
                } else {
                    reject(new Error("ElevenLabs timeout after 30s"));
                }
            }
        }, 30000);

        ws.onopen = () => {
            console.log("[ElevenLabs WS] Connection established.");

            const startMsg = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: {
                        first_message: ""
                    },
                    tts: {
                        mode: replyMode === 'audio' ? 'default' : 'off'
                    }
                }
            };
            ws.send(JSON.stringify(startMsg));
            console.log("[ElevenLabs WS] Initiation sent (with first_message disabled).");

            // Still send input AFTER metadata just to be safe
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);

                if (data.type === "conversation_initiation_metadata") {
                    // If the agent has a first message, we should wait for it to end before sending our input.
                    // Based on previous logs, we got an agent_response immediately.
                    isWaitingForGreetingEnd = true;
                }

                if (data.type === "agent_response") {
                    if (data.agent_response) {
                        fullResponse += data.agent_response;
                    } else if (data.text) {
                        fullResponse += data.text;
                    }
                }

                if (data.type === "audio" && replyMode === 'audio') {
                    if (data.audio_event?.audio_base_64) {
                        audioChunks.push(data.audio_event.audio_base_64);
                    }
                }

                if (data.type === "agent_response_end") {
                    if (!hasSentInput) {
                        const userMsg = {
                            type: "user_input",
                            input: message,
                        };
                        ws.send(JSON.stringify(userMsg));
                        hasSentInput = true;
                    } else {
                        // This was the response to our input
                        isDone = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve({
                            text: fullResponse,
                            audioChunks: replyMode === 'audio' ? audioChunks : undefined
                        });
                    }
                }

                if (data.type === "conversation_end") {
                    console.log("[ElevenLabs WS] Conversation ended.");
                    // This can happen if the agent ends the conversation without a final agent_response_end
                    // or if it's the end of the initial greeting and no further input is expected from the agent.
                    if (!isDone) { // Only resolve if not already resolved by agent_response_end
                        isDone = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve({
                            text: fullResponse,
                            audioChunks: replyMode === 'audio' ? audioChunks : undefined
                        });
                    }
                }

                if (data.type === "internal_error") {
                    console.error("[ElevenLabs WS] Internal Error:", data.error);
                    reject(new Error(`ElevenLabs Internal Error: ${data.error}`));
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
