import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { browserUse } from '@/lib/browser-use';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const automationId = params.id;

        if (!db) {
            return NextResponse.json({ detail: 'Banco de dados offline' }, { status: 500 });
        }

        const docRef = db.collection('automations').doc(automationId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ detail: 'Automação não encontrada' }, { status: 404 });
        }

        const data = doc.data()!;

        // Se já terminou ou falhou, retorna o cache
        if (data.status === 'success' || data.status === 'failed') {
            return NextResponse.json(data);
        }

        // Caso contrário, checa no Cloud o status da tarefa real
        const task = await browserUse.tasks.getTask(data.browser_task_id);

        let newStatus = data.status;
        let newStep = data.step;
        let error = data.error;

        // "finished" e "stopped" são os valores corretos do enum TaskStatus
        if (task.status === "finished") {
            const output = task.output?.toLowerCase() || '';
            if (output.includes('aguardando código') || output.includes('otp')) {
                newStatus = 'waiting';
                newStep = 'awaiting_otp';
            } else {
                newStatus = 'success';
                newStep = 'completed';
            }
        } else if (task.status === "stopped") {
            newStatus = 'failed';
            error = 'A tarefa foi interrompida ou falhou';
        }

        // Atualiza se houve mudança
        if (newStatus !== data.status || newStep !== data.step) {
            await docRef.update({
                status: newStatus,
                step: newStep,
                error: error || null
            });
        }

        return NextResponse.json({
            ...data,
            status: newStatus,
            step: newStep,
            error
        });

    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
