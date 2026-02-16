import { NextResponse } from 'next/server';
import { getPendingResponse, deletePendingResponse } from '@/lib/async-cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const requestId = searchParams.get('requestId');

        if (!requestId) {
            return NextResponse.json({ error: 'requestId não fornecido' }, { status: 400 });
        }

        const response = getPendingResponse(requestId);

        if (!response) {
            return NextResponse.json({
                status: 'not_found',
                error: 'Requisição não encontrada ou expirada'
            }, { status: 404 });
        }

        // Se completou, deletar do cache e retornar
        if (response.status === 'completed' || response.status === 'error') {
            deletePendingResponse(requestId);
        }

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('[StatusRoute] Erro:', error);
        return NextResponse.json({
            error: "Erro ao verificar status.",
            details: error.message
        }, { status: 500 });
    }
}
