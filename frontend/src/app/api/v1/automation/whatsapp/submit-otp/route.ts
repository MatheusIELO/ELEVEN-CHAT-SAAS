import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { whatsappAutomation } from '@/lib/mastra';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { automation_id, otp_code } = await req.json();

        if (!db) return NextResponse.json({ detail: 'DB Offline' }, { status: 500 });

        const docRef = db.collection('automations').doc(automation_id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ detail: 'Não encontrada' }, { status: 404 });

        const data = doc.data()!;

        // Criar uma nova tarefa na mesma sessão para inserir o código usando o helper
        const newTask = await whatsappAutomation.resume(data.browser_session_id, otp_code);

        // Atualiza para rodando novamente
        await docRef.update({
            status: 'running',
            step: 'submitting_otp',
            browser_task_id: newTask.id,
            otp_code: '******'
        });

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
