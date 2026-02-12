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
            return NextResponse.json({ detail: 'API Key não configurada no servidor' }, { status: 500 });
        }

        const setup = await req.json();

        const payload = {
            name: setup.bot_name || "Novo Robô Eleven Chat",
            conversation_config: {
                agent: {
                    prompt: {
                        prompt: `Seu nome é ${setup.bot_name}. Você atua na área de ${setup.area}. ${(setup.language?.startsWith('pt') || !setup.language) ? "Responda sempre em Português do Brasil com sotaque brasileiro natural." : ""} 
                        
                        ESTILO E TONS DE VOZ (PREMIUM):
                        - Seja extremamente humano, amigável e use um tom informal, mas profissional (como um consultor parceiro).
                        - Use emojis de forma natural para transmitir simpatia, mas não exagere.
                        - Varie suas respostas. EVITE repetições de frases ou saudações.
                        
                        DIRETRIZES DE CONVERSA:
                        1. NÃO repita saudações (como "Olá", "Tudo bem?") se a conversa já estiver em andamento. Se o usuário já falou algo, vá direto ao ponto.
                        2. Mantenha respostas curtas e escaneáveis (estilo WhatsApp). No máximo 2 ou 3 frases curtas.
                        3. Se o usuário perguntar algo que você já respondeu, tente explicar de outra forma mais clara.
                        4. Seu foco é ser útil e levar o cliente para a conversão ou resolução, sem parecer um robô de telemarketing.
                        
                        CONTEXTO DA EMPRESA:
                        ${setup.prompt}`,
                        llm: "gemini-1.5-flash"
                    },
                    first_message: " ", // Forçar espaço para evitar travamento no WebSocket
                    language: (setup.language || "pt").substring(0, 2)
                },
                tts: {
                    model_id: "eleven_flash_v2_5",
                    voice_id: setup.voice_id || "21m00Tcm4TlvDq8ikWAM"
                }
            },
            platform_settings: {
                zero_retention_mode: false
            }
        };

        // 1. Criar na ElevenLabs
        const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Could not parse response' }));
            return NextResponse.json({ detail: `Erro ElevenLabs: ${JSON.stringify(errorData)}` }, { status: response.status });
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
        if (db) {
            const userRef = db.collection('users').doc(userId);
            await userRef.collection('agents').doc(agent_id).set({
                ...setup,
                agent_id,
                updatedAt: new Date().toISOString()
            });
        }

        return NextResponse.json({ status: 'success', agent_id });
    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
