import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { whatsappAutomation } from '@/lib/mastra';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) {
            return NextResponse.json({ detail: 'User ID não informado' }, { status: 401 });
        }

        const { agent_id, email, password, phone } = await req.json();

        // Usando o helper que centraliza a lógica
        const { sessionId, taskId } = await whatsappAutomation.start(agent_id, email, password, phone);

        const automationId = `wa_${agent_id}_${Date.now()}`;

        // 3. Registrar no Firestore
        if (db) {
            await db.collection('automations').doc(automationId).set({
                status: 'running',
                agent_id,
                user_id: userId,
                browser_session_id: sessionId,
                browser_task_id: taskId,
                step: 'navigating',
                timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json({
            status: 'success',
            automation_id: automationId,
            session_id: sessionId,
            task_id: taskId
        });

    } catch (error: any) {
        console.error('Erro ao iniciar automação:', error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
