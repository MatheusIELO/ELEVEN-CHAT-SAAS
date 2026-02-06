import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) {
            return NextResponse.json({ detail: 'User ID não informado' }, { status: 401 });
        }

        const apiKey = process.env.ELEVEN_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ detail: 'API Key não configurada' }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string;

        if (!file) {
            return NextResponse.json({ detail: 'Arquivo não enviado' }, { status: 400 });
        }

        const elevenLabsFormData = new FormData();
        elevenLabsFormData.append('file', file);
        elevenLabsFormData.append('name', name || file.name);

        const response = await fetch("https://api.elevenlabs.io/v1/convai/knowledge-base", {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey
            },
            body: elevenLabsFormData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Could not parse response' }));
            return NextResponse.json({ detail: `Erro ElevenLabs Knowledge: ${JSON.stringify(errorData)}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
