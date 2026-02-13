import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('user-id');
        if (!userId) {
            return NextResponse.json({ detail: 'User ID não informado' }, { status: 401 });
        }

        const apiKey = process.env.ELEVEN_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ detail: 'API Key não configurada' }, { status: 500 });
        }

        // 1. Buscar agentes do usuário no Firestore
        const agentsSnapshot = await db.collection('users').doc(userId).collection('agents').get();
        const agents = agentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (agents.length === 0) {
            return NextResponse.json({
                total_conversations: 0,
                conversion_rate: 0,
                active_leads: 0,
                avg_duration: 0,
                top_regions: [],
                status: 'no_data'
            });
        }

        let allConversations: any[] = [];

        // 2. Buscar conversas de cada agente na ElevenLabs
        // Limitamos a busca para não estourar rate limit se houver muitos agentes
        const fetchPromises = agents.slice(0, 5).map(async (agent: any) => {
            try {
                const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent.agent_id}&page_size=20`, {
                    headers: { 'xi-api-key': apiKey }
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.conversations || [];
                }
            } catch (err) {
                console.error(`Error fetching convs for agent ${agent.agent_id}:`, err);
            }
            return [];
        });

        const results = await Promise.all(fetchPromises);
        allConversations = results.flat();

        // 3. Processar Métricas
        const total_conversations = allConversations.length;
        let total_duration = 0;
        let leads_count = 0;
        let conversion_count = 0;
        const regions: Record<string, number> = {};
        const products: Record<string, number> = {};

        // Weekly Filtering (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        allConversations.forEach(conv => {
            const convDate = new Date(conv.start_time_unix_ms || Date.now());
            const isWeekly = convDate >= sevenDaysAgo;

            total_duration += (conv.duration_seconds || 0);

            // Analisar Data Collection (Entities)
            const analysis = conv.analysis || {};
            const dataResults = analysis.data_collection_results || {};

            // Consideramos "Lead" se coletou nome, email ou telefone
            if (dataResults.customer_name || dataResults.customer_email || dataResults.customer_phone) {
                leads_count++;
            }

            // Exemplo de conversão: se houver interesse em produto e status for sucesso
            if (dataResults.produto_interesse && conv.status === 'success') {
                conversion_count++;
            }

            // Região (Supondo que configuramos o bot para perguntar isso)
            if (isWeekly) {
                const region = dataResults.customer_region || dataResults.cidade || "Outros";
                if (region !== "Outros") {
                    regions[region] = (regions[region] || 0) + 1;
                }

                const product = dataResults.produto_interesse || "Geral";
                if (product !== "Geral") {
                    products[product] = (products[product] || 0) + 1;
                }
            }
        });

        // Formatar Top Regions (Weekly)
        const weekly_regions = Object.entries(regions)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Formatar Top Products (Weekly)
        const weekly_products = Object.entries(products)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const avg_duration = total_conversations > 0 ? Math.round(total_duration / total_conversations) : 0;
        const conversion_rate = total_conversations > 0 ? Math.round((conversion_count / total_conversations) * 100) : 0;

        return NextResponse.json({
            total_conversations,
            conversion_rate,
            active_leads: leads_count,
            avg_duration: `${avg_duration}s`,
            weekly_regions,
            weekly_products,
            total_agents: agents.length
        });

    } catch (error: any) {
        console.error('Metrics Error:', error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
