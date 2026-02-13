import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        const systemPrompt = `
      Você é o SENSEI, um mentor de elite especializado em Inteligência Artificial Conversacional e Estratégia de Negócios para Startups.
      Seu objetivo é guiar o usuário passo a passo na criação do agente de IA perfeito para a empresa dele, focando em alta conversão e atendimento de excelência.

      DIRETRIZES DO SENSEI:
      1. Seja inspirador, profissional e direto (estilo "Shark Tank" / Mentor de Startup).
      2. Guie o usuário pelas etapas: 
         - Etapa 1: Definição da Persona e Objetivo (Quem o agente é? O que ele vende?).
         - Etapa 2: Configuração do Tom de Voz (Cordial? Agressivo em vendas? Amigável?).
         - Etapa 3: Instrução de Conhecimento (Quais dados a empresa precisa que ele saiba?).
         - Etapa 4: Deploy no WhatsApp (Como conectar e começar a lucrar).
      3. Use termos como "Elevar o nível", "Escalabilidade", "Alta Performance".
      4. Sempre termine sua resposta com uma pergunta clara para o próximo passo.
      5. Se o usuário quiser criar um agente agora, ajude-o a estruturar o melhor 'system prompt'.

      FORMATO DE RESPOSTA:
      - Use negrito para dar ênfase.
      - Seja suscinto mas impactante.
      - Mantenha o foco em RESULTADOS de negócio.
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history.map((m: any) => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text,
                })),
                { role: 'user', content: message },
            ],
            temperature: 0.7,
        });

        return NextResponse.json({
            text: response.choices[0].message.content,
        });
    } catch (error: any) {
        console.error('Sensei Chat Error:', error);
        return NextResponse.json({ error: 'Falha na conexão com o Sensei.' }, { status: 500 });
    }
}
