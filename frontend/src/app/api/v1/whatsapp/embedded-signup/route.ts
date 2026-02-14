import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * Endpoint for Meta Embedded Signup Callback
 * Receives short-lived user token and links the WhatsApp number to the agent
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { access_token, agent_id } = body;
        const userId = req.headers.get('user-id');

        if (!userId || !agent_id || !access_token) {
            console.error('[Embedded Signup] Parâmetros ausentes:', { userId, agent_id, token: !!access_token });
            return NextResponse.json({ error: 'Parâmetros ausentes para a conexão' }, { status: 400 });
        }

        if (!db) {
            console.error('[Embedded Signup] Firestore não inicializado');
            return NextResponse.json({ error: 'Erro interno no banco de dados' }, { status: 500 });
        }

        console.log(`[Embedded Signup] Processando conexão para Agent: ${agent_id}`);

        // 1. Fetch WABA (WhatsApp Business Account)
        // Usamos o token do usuário recebido do popup para listar as contas dele
        const wabaRes = await fetch(`https://graph.facebook.com/v21.0/me/whatsapp_business_accounts?access_token=${access_token}`);
        const wabaData = await wabaRes.json();

        if (!wabaData.data || wabaData.data.length === 0) {
            console.error('[Embedded Signup] Nenhuma WABA encontrada:', wabaData);
            return NextResponse.json({ error: 'Nenhuma conta de business WhatsApp encontrada para este perfil.' }, { status: 404 });
        }

        // Pegamos a primeira WABA vinculada (comportamento padrão para setup simples)
        const wabaId = wabaData.data[0].id;

        // 2. Fetch Phone Numbers para esta WABA
        const phoneRes = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${access_token}`);
        const phoneData = await phoneRes.json();

        if (!phoneData.data || phoneData.data.length === 0) {
            console.error('[Embedded Signup] Nenhum número encontrado na WABA:', wabaId);
            return NextResponse.json({ error: 'Nenhum número de telefone encontrado na sua conta business.' }, { status: 404 });
        }

        // Pegamos o primeiro número de telefone
        const phoneNumberId = phoneData.data[0].id;
        const phoneNumber = phoneData.data[0].display_phone_number;

        // 3. Persistência no Firestore
        // Buscamos o documento do agente
        const agentRef = db.collection('agents').doc(agent_id);
        const agentDoc = await agentRef.get();

        if (!agentDoc.exists) {
            return NextResponse.json({ error: 'Agente não encontrado no sistema.' }, { status: 404 });
        }

        await agentRef.update({
            'whatsapp_config.access_token': access_token, // Salva o token do usuário (idealmente trocar por long-lived no futuro)
            'whatsapp_config.phone_number_id': phoneNumberId,
            'whatsapp_config.waba_id': wabaId,
            'whatsapp_config.display_phone_number': phoneNumber,
            'whatsapp_config.connected_at': new Date().toISOString(),
            'whatsapp_config.status': 'active'
        });

        console.log(`[Embedded Signup] Sucesso! Agente ${agent_id} vinculado ao número ${phoneNumber}`);

        return NextResponse.json({
            success: true,
            phone_number: phoneNumber,
            phone_number_id: phoneNumberId
        });

    } catch (error: any) {
        console.error('[Embedded Signup] Critical Error:', error);
        return NextResponse.json({ error: 'Falha interna ao processar conexão Meta', details: error.message }, { status: 500 });
    }
}
