import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId || !db) return NextResponse.json({ total_conversations: 0, total_leads: 0 });

        const userRef = db.collection('users').doc(userId);
        const interactions = await userRef.collection('interactions').get();
        const leads = await userRef.collection('leads').get();

        const countInteractions = interactions.size;
        const countLeads = leads.size;

        return NextResponse.json({
            total_conversations: countInteractions,
            total_leads: countLeads,
            conversion_rate: countInteractions > 0 ? `${((countLeads / countInteractions) * 100).toFixed(1)}%` : "0%"
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json({ total_conversations: 0, total_leads: 0 });
    }
}
