import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId || !db) return NextResponse.json([]);

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        const userRef = db.collection('users').doc(userId);
        const docs = await userRef.collection('interactions')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const results = docs.docs.map(doc => {
            const data = doc.to_dict(); // Wait, in Node SDK it's doc.data()
            const d = doc.data();
            if (d.timestamp && d.timestamp.toDate) {
                d.timestamp = d.timestamp.toDate().toISOString();
            }
            return d;
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error('Interactions fetch error:', error);
        return NextResponse.json([]);
    }
}
