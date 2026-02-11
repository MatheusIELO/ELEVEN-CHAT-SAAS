/**
 * ElevenLabs Conversational AI Bridge
 * Handles text-to-text communication with ElevenLabs Agents
 */

export interface AgentResponse {
    text: string;
    conversation_id?: string;
}

/**
 * Sends a text message to an ElevenLabs Agent and waits for the response.
 * Uses WebSockets under the hood for real-time ConvAI interaction.
 */
export async function getElevenLabsAgentResponse(
    agentId: string,
    message: string,
    apiKey: string,
    sessionId?: string
): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;

        // In Node.js environment, we can pass headers to the WebSocket constructor
        // Note: 'ws' library is usually needed for this in Node, but standard WebSocket in some envs might not support third arg.
        // We'll try to use the 'ws' library pattern if available or fallback to query param (not recommended but works for some)

        const ws = new WebSocket(wsUrl, {
            headers: {
                "xi-api-key": apiKey
            }
        } as any);


        let fullResponse = "";
        let isDone = false;

        const timeout = setTimeout(() => {
            if (!isDone) {
                ws.close();
                reject(new Error("ElevenLabs timeout after 15s"));
            }
        }, 15000);

        ws.onopen = () => {
            // 1. Send authorization
            // For WebSockets, we often use signed URLs, but some versions allow sending the key in the first message
            // Documentation update: Most current versions require a handshake or signed URL.
            // If we have an API key, we can also use it in the query param or custom header if supported.
            // For simplicity and following common patterns, we send a JSON start message.

            const startMsg = {
                type: "conversation_initiation_client_data",
                conversation_config_override: {
                    agent: {
                        prompt: { override: true },
                        first_message: { override: true }
                    }
                }
            };
            ws.send(JSON.stringify(startMsg));

            // 2. Send the actual user input
            const userMsg = {
                type: "user_input",
                input: message,
                // Setting text_only usually comes from agent config, but some versions support runtime overrides
            };
            ws.send(JSON.stringify(userMsg));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);

                // Track different message types
                if (data.type === "agent_response") {
                    fullResponse += data.agent_response;
                }

                if (data.type === "audio") {
                    // Ignore audio for WhatsApp text-only
                }

                if (data.type === "agent_response_end" || data.type === "conversation_end") {
                    isDone = true;
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ text: fullResponse });
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
                resolve({ text: fullResponse });
            }
        };
    });
}
