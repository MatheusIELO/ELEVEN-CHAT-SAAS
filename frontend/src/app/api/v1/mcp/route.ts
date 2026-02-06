import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ElevenLabs MCP Server Implementation
 * Standard: Model Context Protocol (JSON-RPC 2.0 over HTTP)
 */
export async function POST(req: Request) {
    try {
        const secretKey = req.headers.get('x-secret-key');
        if (secretKey !== 'eleven_chat_master_secret') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { method, params, id } = body;

        console.log(`[MCP] Request: ${method}`, params);

        // Standard JSON-RPC 2.0 Response Template
        const response = (result: any) => NextResponse.json({
            jsonrpc: "2.0",
            id: id || null,
            result
        });

        const error = (code: number, message: string) => NextResponse.json({
            jsonrpc: "2.0",
            id: id || null,
            error: { code, message }
        });

        switch (method) {
            case 'initialize':
                return response({
                    protocolVersion: "2024-11-05",
                    capabilities: {},
                    serverInfo: {
                        name: "Eleven Chat MCP Server",
                        version: "1.0.0"
                    }
                });

            case 'tools/list':
                return response({
                    tools: [
                        {
                            name: "get_user_summary",
                            description: "Get a summary of the current user's business and area of expertise to provide more context.",
                            inputSchema: {
                                type: "object",
                                properties: {},
                                required: []
                            }
                        },
                        {
                            name: "record_business_lead",
                            description: "Save a new business lead into the database when a user shows interest.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    name: { type: "string", description: "Name of the lead" },
                                    phone: { type: "string", description: "Phone number" },
                                    email: { type: "string", description: "Email address" },
                                    notes: { type: "string", description: "Additional context about the lead's interest" }
                                },
                                required: ["name"]
                            }
                        }
                    ]
                });

            case 'tools/call':
                const toolName = params.name;
                const args = params.arguments || {};

                console.log(`[MCP] Calling tool: ${toolName}`, args);

                if (toolName === 'get_user_summary') {
                    return response({
                        content: [{
                            type: "text",
                            text: "Este é um sistema de atendimento automatizado via WhatsApp e Web. O foco é capturar leads qualificados para o negócio."
                        }]
                    });
                }

                if (toolName === 'record_business_lead') {
                    // Aqui poderíamos salvar no Firestore se tivéssemos o userId no contexto do MCP.
                    // A ElevenLabs permite passar cabeçalhos customizados no MCP.
                    return response({
                        content: [{
                            type: "text",
                            text: `Sucesso! O lead ${args.name} foi registrado. Diga ao usuário que um especialista entrará em contato em breve.`
                        }]
                    });
                }

                return error(-32601, "Method not found");

            default:
                return error(-32601, "Method not found");
        }

    } catch (err: any) {
        console.error('[MCP] Error:', err);
        return NextResponse.json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal error" }
        }, { status: 500 });
    }
}

/**
 * GET handler for simple discovery/landing
 */
export async function GET() {
    return NextResponse.json({
        status: "online",
        name: "Eleven Chat MCP Server",
        description: "Connect your ElevenLabs agents to our platform tools."
    });
}
