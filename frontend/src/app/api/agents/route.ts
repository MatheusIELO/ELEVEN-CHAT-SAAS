import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) return NextResponse.json([]);

        const userRef = db.collection('users').doc(userId);
        const settingsSnap = await userRef.collection('settings').get();

        const agents = settingsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(agents);
    } catch (error) {
        console.error('List agents error:', error);
        return NextResponse.json([]);
    }
}
