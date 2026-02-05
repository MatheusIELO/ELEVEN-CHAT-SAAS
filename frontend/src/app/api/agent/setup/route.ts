import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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

        const setup = await req.json();

        // 1. Atualizar na ElevenLabs
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${setup.agent_id}`, {
            method: 'PATCH',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: setup.bot_name,
                conversation_config: {
                    agent: {
                        prompt: {
                            prompt: `Seu nome é ${setup.bot_name}. Você atua na área de ${setup.area}. ${setup.prompt}`
                        },
                        first_message: setup.first_message,
                        language: setup.language
                    },
                    tts_config: {
                        model_id: setup.model_id,
                        voice_id: setup.voice_id
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ detail: `Erro ElevenLabs: ${errorText}` }, { status: response.status });
        }

        // 2. Configurar Data Collection
        const dataCollection: Record<string, any> = {};
        setup.entities.forEach((entity: any) => {
            dataCollection[entity.name] = { type: "string", description: entity.description };
        });

        await fetch(`https://api.elevenlabs.io/v1/convai/agents/${setup.agent_id}`, {
            method: 'PATCH',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                analysis_config: { data_collection: dataCollection }
            })
        });

        // 3. Salvar no Firestore
        const userRef = db.collection('users').doc(userId);
        await userRef.collection('settings').doc('current_agent').set({
            ...setup,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ status: 'success', message: 'Robô atualizado e salvo!' });
    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
