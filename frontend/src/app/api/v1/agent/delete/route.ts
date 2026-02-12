import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function DELETE(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get('agentId');

        if (!userId) {
            return NextResponse.json({ detail: 'User ID não informado' }, { status: 401 });
        }

        if (!agentId) {
            return NextResponse.json({ detail: 'Agent ID não informado' }, { status: 400 });
        }

        const apiKey = process.env.ELEVEN_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ detail: 'API Key não configurada' }, { status: 500 });
        }

        // 1. Deletar na ElevenLabs
        const elResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
            method: 'DELETE',
            headers: {
                'xi-api-key': apiKey
            }
        });

        // Mesmo se der erro na ElevenLabs (ex: agente já deletado lá), tentamos limpar o banco local
        // Mas vamos logar se falhar
        if (!elResponse.ok) {
            console.warn(`[Delete Agent] ElevenLabs return status ${elResponse.status} for agent ${agentId}`);
        }

        // 2. Deletar no Firestore
        if (db) {
            const agentRef = db.collection('users').doc(userId).collection('agents').doc(agentId);
            await agentRef.delete();
        }

        return NextResponse.json({ status: 'success', message: 'Agente removido com sucesso' });
    } catch (error: any) {
        console.error('Delete Agent Error:', error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
