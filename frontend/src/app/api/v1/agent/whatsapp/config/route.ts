import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) {
            return NextResponse.json({ detail: 'User ID não informado' }, { status: 401 });
        }

        const { agent_id, whatsapp_config } = await req.json();

        if (!agent_id) {
            return NextResponse.json({ detail: 'Agent ID não informado' }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ detail: 'Database connection failed' }, { status: 500 });
        }

        // Search for the agent document belonging to this user
        // Note: agents are stored under users/{userId}/agents/{agent_id}
        const agentRef = db.collection('users').doc(userId).collection('agents').doc(agent_id);
        const agentDoc = await agentRef.get();

        if (!agentDoc.exists) {
            return NextResponse.json({ detail: 'Agente não encontrado' }, { status: 404 });
        }

        // Update the agent with the new WhatsApp configuration
        await agentRef.update({
            whatsapp_config: {
                ...whatsapp_config,
                updated_at: new Date().toISOString()
            }
        });

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('Erro ao salvar config WhatsApp:', error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
