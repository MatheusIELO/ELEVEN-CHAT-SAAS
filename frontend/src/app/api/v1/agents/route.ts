import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId || !db) return NextResponse.json([]);

        const userRef = db.collection('users').doc(userId);

        // Tenta buscar na nova coleção de agentes
        const agentsSnap = await userRef.collection('agents').get();

        if (agentsSnap.empty) {
            // Fallback para migração
            const legacySnap = await userRef.collection('settings').doc('current_agent').get();
            if (legacySnap.exists) {
                const data = legacySnap.data();
                return NextResponse.json([{
                    ...data,
                    id: data?.agent_id || 'legacy'
                }]);
            }
            return NextResponse.json([]);
        }

        const agents = agentsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(agents);
    } catch (error) {
        console.error('List agents error:', error);
        return NextResponse.json([]);
    }
}
