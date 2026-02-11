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
            const text = message.text?.body;
            const businessPhoneNumberId = value.metadata?.phone_number_id;

            if (text && businessPhoneNumberId && db) {
                console.log(`[Webhook] Message from ${from}: ${text} (ID: ${businessPhoneNumberId})`);

                // 1. Identify which ElevenLabs agent is associated with this businessPhoneNumberId
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
                    console.error('[Webhook] Missing configuration for agent:', elevenAgentId);
                    return NextResponse.json({ status: 'config_error' });
                }

                // 2. Forward message to ElevenLabs AI Agent
                const { getElevenLabsAgentResponse } = await import('@/lib/elevenlabs');
                const aiResponse = await getElevenLabsAgentResponse(
                    elevenAgentId,
                    text,
                    process.env.ELEVEN_API_KEY || ''
                );

                // 3. Send response back via Meta Cloud API
                const { sendMetaMessage } = await import('@/lib/meta');
                await sendMetaMessage(
                    from,
                    aiResponse.text,
                    businessPhoneNumberId,
                    whatsappConfig.access_token
                );

                console.log(`[Webhook] Replied to ${from} using agent ${elevenAgentId}`);
            }
        }


        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('[Webhook] Error processing WhatsApp message:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
