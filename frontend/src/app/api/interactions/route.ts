import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) return NextResponse.json([]);

        const userRef = db.collection('users').document(userId);
        const snap = await userRef.collection('interactions')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const results = snap.docs.map(doc => {
            const data = doc.data();
            // Converter timestamps do Firestore para ISO strings
            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                data.timestamp = data.timestamp.toDate().toISOString();
            }
            return data;
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error('Interactions error:', error);
        return NextResponse.json([]);
    }
}
