import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const agentId = payload.agent_id;

        if (!db) return NextResponse.json({ status: 'error', message: 'DB not connected' });

        // Busca o dono do agent_id
        let userOwnerId = null;

        // Tenta buscar na coleção 'agents' primeiro (preferencial)
        const agentsSnap = await db.collectionGroup('agents')
            .where('agent_id', '==', agentId)
            .limit(1)
            .get();

        if (!agentsSnap.empty) {
            userOwnerId = agentsSnap.docs[0].ref.parent.parent?.id;
        } else {
            // Fallback para 'settings' antigo
            const settingsSnap = await db.collectionGroup('settings')
                .where('agent_id', '==', agentId)
                .limit(1)
                .get();
            if (!settingsSnap.empty) {
                userOwnerId = settingsSnap.docs[0].ref.parent.parent?.id;
            }
        }

        if (!userOwnerId) {
            return NextResponse.json({ status: 'ignored', message: 'User not found for this agent' });
        }

        const data = payload.analysis.data_collection;
        const insight = {
            conversation_id: payload.conversation_id,
            agent_id: payload.agent_id,
            summary: payload.analysis.summary,
            sentiment: payload.analysis.sentiment,
            extracted_data: data,
            timestamp: new Date().toISOString()
        };

        const userRef = db.collection('users').doc(userOwnerId);
        await userRef.collection('interactions').doc(payload.conversation_id).set(insight);

        // Lógica de Leads
        const leadKeys = ["customer_name", "nome", "nome_cliente", "customer_email", "customer_phone"];
        if (Object.keys(data).some(k => leadKeys.includes(k.toLowerCase()))) {
            await userRef.collection('leads').add({ ...insight, type: 'detected_lead' });
        }

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
