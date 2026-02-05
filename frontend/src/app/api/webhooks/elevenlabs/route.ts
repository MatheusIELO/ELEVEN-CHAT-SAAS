import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const agentId = payload.agent_id;

        // Busca o dono do agent_id
        let userOwnerId = null;
        const usersSnap = await db.collectionGroup('settings')
            .where('agent_id', '==', agentId)
            .limit(1)
            .get();

        if (!usersSnap.empty) {
            // settings is in users/{uid}/settings
            userOwnerId = usersSnap.docs[0].ref.parent.parent?.id;
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
            timestamp: new Date()
        };

        const userRef = db.collection('users').document(userOwnerId);
        await userRef.collection('interactions').document(payload.conversation_id).set(insight);

        // Lógica de Leads
        const leadKeys = ["customer_name", "nome", "nome_cliente", "email", "telefone"];
        if (Object.keys(data).some(k => leadKeys.includes(k.toLowerCase()))) {
            await userRef.collection('leads').add({ ...insight, type: 'detected_lead' });
        }

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
