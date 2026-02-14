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

        const payload = {
            name: setup.bot_name,
            conversation_config: {
                agent: {
                    prompt: {
                        prompt: `Seu nome é ${setup.bot_name}. Você atua na área de ${setup.area}. ${setup.language === 'pt-br' ? "Responda sempre em Português do Brasil com sotaque brasileiro natural." : setup.language === 'pt' ? "Responda sempre em Português de Portugal com sotaque lusitano natural." : "Eng: Respond always in English."} 
                        
                        ESTILO E TONS DE VOZ (PREMIUM):
                        - Seja extremamente humano, amigável, cordial e educado. Utilize um tom profissional e prestativo.
                        - PROIBIDO o uso de gírias (como "beleza", "sussa", "e aí", "eae"). Mantenha a elegância e sobriedade na fala.
                        - Use emojis de forma natural para transmitir simpatia, mas sem excessos.
                        - Varie suas respostas. EVITE repetições de frases ou fórmulas prontas.
                        
                        DIRETRIZES DE CONVERSA:
                        1. NÃO use saudações (como "Olá", "Tudo bem?", "Como posso ajudar?") se a conversa já estiver em andamento. Se o usuário já falou algo anteriormente, vá DIRETO ao assunto da pergunta atual sem introduções desnecessárias.
                        2. Mantenha respostas curtas e escaneáveis (estilo WhatsApp). No máximo 2 ou 3 frases curtas.
                        3. Se o usuário perguntar algo que você já respondeu, tente explicar de outra forma mais clara.
                        4. Seu foco é ser útil e levar o cliente para a conversão ou resolução.
                        
                        CONTEXTO DA EMPRESA:
                        ${setup.prompt}`,
                        llm: "gemini-1.5-flash"
                    },
                    first_message: " ", // Forçar espaço para estabilidade
                    language: setup.language || "pt-br"
                },
                tts: {
                    model_id: "eleven_flash_v2_5",
                    voice_id: setup.voice_id
                }
            }
        };

        // 1. Atualizar na ElevenLabs
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${setup.agent_id}`, {
            method: 'PATCH',
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

        // 2. Configurar Data Collection
        const dataCollection: Record<string, any> = {};
        if (setup.entities) {
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
        }

        // 3. Salvar no Firestore
        if (db) {
            const userRef = db.collection('users').doc(userId);
            await userRef.collection('agents').doc(setup.agent_id).set({
                ...setup,
                updatedAt: new Date().toISOString()
            });
        }

        return NextResponse.json({ status: 'success', message: 'Robô atualizado e salvo!' });
    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
