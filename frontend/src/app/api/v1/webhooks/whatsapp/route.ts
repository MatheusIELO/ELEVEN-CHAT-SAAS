import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * Meta WhatsApp Webhook
 * Handles validation (GET) and incoming messages (POST)
 */

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // The verify token should be configured in your Meta Developer App
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'eleven_chat_verify_token';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] WhatsApp verified successfully');
        return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Log incoming message for debugging
        console.log('[Webhook] Incoming WhatsApp Message:', JSON.stringify(body, null, 2));

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            const from = message.from; // Sender's phone number
            const businessPhoneNumberId = value.metadata?.phone_number_id;

            // Extract content based on message type
            const messageType = message.type;
            const textBody = message.text?.body;
            const audioId = message.audio?.id;

            if (businessPhoneNumberId && db) {
                // 1. Identify Agent
                const agentsSnapshot = await db.collectionGroup('agents')
                    .where('whatsapp_config.phone_number_id', '==', businessPhoneNumberId)
                    .limit(1)
                    .get();

                if (agentsSnapshot.empty) {
                    console.warn(`[Webhook] No agent found for phone_number_id: ${businessPhoneNumberId}`);
                    return NextResponse.json({ status: 'ignored' });
                }

                const agentData = agentsSnapshot.docs[0].data();
                const elevenAgentId = agentData.agent_id;
                const whatsappConfig = agentData.whatsapp_config;

                if (!elevenAgentId || !whatsappConfig?.access_token) {
                    console.error('[Webhook] Missing config for agent:', elevenAgentId);
                    return NextResponse.json({ status: 'config_error' });
                }

                // 2. Process Input
                let aiResponseText = '';

                if (messageType === 'text' && textBody) {
                    console.log(`[Webhook] Text from ${from}: ${textBody}`);

                    // ElevenLabs Agent (Text -> Text)
                    const { getElevenLabsAgentResponse } = await import('@/lib/elevenlabs');
                    const aiResponse = await getElevenLabsAgentResponse(
                        elevenAgentId,
                        textBody,
                        process.env.ELEVEN_API_KEY || ''
                    );
                    aiResponseText = aiResponse.text;

                    // Send Text Response
                    const { sendMetaMessage } = await import('@/lib/meta');
                    await sendMetaMessage(
                        from,
                        aiResponseText,
                        businessPhoneNumberId,
                        whatsappConfig.access_token
                    );

                } else if (messageType === 'audio' && audioId) {
                    console.log(`[Webhook] Audio from ${from} (ID: ${audioId})`);

                    // TODO: Transcribe Audio (OGG -> Text)
                    // Currently skipping transcription due to infrastructure limits (ffmpeg required).
                    // For now, valid behavior is to inform user we can't hear them yet, OR respond to a "phantom" query if we want to test Audio Output.

                    // Fallback: Inform user (in Text)
                    const { sendMetaMessage } = await import('@/lib/meta');
                    await sendMetaMessage(
                        from,
                        "🔊 Recebi seu áudio! No momento, meu sistema de audição está sendo calibrado. Por favor, envie texto por enquanto.",
                        businessPhoneNumberId,
                        whatsappConfig.access_token
                    );

                    /* 
                    // FUTURE IMPLEMENTATION: Text -> Speech -> WhatsApp Audio
                    if (aiResponseText) {
                        const { generateSpeech } = await import('@/lib/elevenlabs');
                        const mp3Buffer = await generateSpeech(
                            aiResponseText,
                            agentData.conversation_config?.tts_config?.voice_id || "21m00Tcm4TlvDq8ikWAM",
                            process.env.ELEVEN_API_KEY || ''
                        );
                        
                        const { uploadMetaMedia, sendMetaAudio } = await import('@/lib/meta');
                        const mediaId = await uploadMetaMedia(
                            businessPhoneNumberId,
                            whatsappConfig.access_token,
                            mp3Buffer
                        );
                        
                        await sendMetaAudio(
                            from,
                            businessPhoneNumberId,
                            whatsappConfig.access_token,
                            mediaId
                        );
                    }
                    */
                }

                console.log(`[Webhook] Processed message from ${from}`);
            }
        }


        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('[Webhook] Error processing WhatsApp message:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
