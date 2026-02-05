import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) return NextResponse.json({ total_conversations: 0, total_leads: 0 });

        const userRef = db.collection('users').document(userId);
        const [interactionsSnap, leadsSnap] = await Promise.all([
            userRef.collection('interactions').get(),
            userRef.collection('leads').get()
        ]);

        const totalInteractions = interactionsSnap.size;
        const totalLeads = leadsSnap.size;
        const conversionRate = totalInteractions > 0
            ? ((totalLeads / totalInteractions) * 100).toFixed(1) + '%'
            : '0%';

        return NextResponse.json({
            total_conversations: totalInteractions,
            total_leads: totalLeads,
            conversion_rate: conversionRate
        });
    } catch (error) {
        return NextResponse.json({ total_conversations: 0, total_leads: 0 });
    }
}
