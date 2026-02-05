import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) {
            return NextResponse.json({ detail: 'User ID não informado' }, { status: 401 });
        }

        const apiKey = process.env.ELEVEN_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ detail: 'API Key não configurada no servidor' }, { status: 500 });
        }

        const setup = await req.json();

        // 1. Criar na ElevenLabs
        const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: setup.bot_name || "Novo Robô Eleven Chat",
                conversation_config: {
                    agent: {
                        prompt: {
                            prompt: `Seu nome é ${setup.bot_name}. Você atua na área de ${setup.area}. ${setup.prompt}`
                        },
                        first_message: setup.first_message || `Olá! Eu sou ${setup.bot_name}, como posso te ajudar hoje?`,
                        language: setup.language || "pt"
                    },
                    asr_config: {
                        model: "scribe_v1",
                        language: setup.language || "pt"
                    },
                    tts_config: {
                        model_id: setup.model_id || "eleven_turbo_v2_5",
                        voice_id: setup.voice_id || "21m00Tcm4TlvDq8ikWAM"
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ detail: `Erro ElevenLabs: ${errorText}` }, { status: response.status });
        }

        const { agent_id } = await response.json();

        // 2. Configurar Data Collection
        if (setup.entities && setup.entities.length > 0) {
            const dataCollection: Record<string, any> = {};
            setup.entities.forEach((entity: any) => {
                dataCollection[entity.name] = { type: "string", description: entity.description };
            });

            await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent_id}`, {
                method: 'PATCH',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    analysis_config: { data_collection: dataCollection }
                })
            });
        }

        // 3. Salvar no Firestore
        const userRef = db.collection('users').document(userId);
        await userRef.collection('settings').document('current_agent').set({
            ...setup,
            agent_id,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ status: 'success', agent_id });
    } catch (error: any) {
        console.error('Create agent error:', error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
