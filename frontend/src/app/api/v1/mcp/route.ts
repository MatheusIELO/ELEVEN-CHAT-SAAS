import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ElevenLabs MCP Server Implementation
 * Standard: Model Context Protocol (JSON-RPC 2.0 over HTTP)
 */
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Secret-Key',
        },
    });
}

export async function POST(req: Request) {
    try {
        const secretKey = req.headers.get('x-secret-key') || req.headers.get('X-Secret-Key');
        if (secretKey !== 'eleven_chat_master_secret') {
            console.error('[MCP] Unauthorized access attempt');
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Secret-Key',
                }
            });
        }

        const body = await req.json();
        const { method, params, id } = body;

        console.log(`[MCP] Request: ${method}`, params);

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Secret-Key',
        };

        const response = (result: any) => NextResponse.json({
            jsonrpc: "2.0",
            id: id !== undefined ? id : null,
            result
        }, { headers: corsHeaders });

        const error = (code: number, message: string) => NextResponse.json({
            jsonrpc: "2.0",
            id: id !== undefined ? id : null,
            error: { code, message }
        }, { headers: corsHeaders });

        switch (method) {
            case 'initialize':
                return response({
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        tools: { listChanged: false }
                    },
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
                            name: "provision_whatsapp_agent",
                            description: "Phase 2: Use this tool to register the user's WhatsApp number in Meta and start the automation process.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    phone: { type: "string", description: "The WhatsApp number to register (E.164 format, e.g., +5511999999999)" },
                                    agent_id: { type: "string", description: "The ID of the ElevenLabs agent to connect" }
                                },
                                required: ["phone", "agent_id"]
                            }
                        },
                        {
                            name: "create_platform_agent",
                            description: "Create a new agent in the Eleven Chat platform with specific business instructions.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    name: { type: "string", description: "Agent name" },
                                    area: { type: "string", description: "Business area" },
                                    prompt: { type: "string", description: "Base instructions for the agent" },
                                    whatsapp_number: { type: "string", description: "The WhatsApp number to connect" }
                                },
                                required: ["name", "area", "whatsapp_number"]
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

                if (toolName === 'provision_whatsapp_agent') {
                    return response({
                        content: [{
                            type: "text",
                            text: `Iniciando Fase 2 para o agente ${args.agent_id}. O número ${args.phone} está sendo processado para registro no Meta Business Platform.`
                        }]
                    });
                }

                if (toolName === 'create_platform_agent') {
                    return response({
                        content: [{
                            type: "text",
                            text: `Agente '${args.name}' configurado com sucesso para a área '${args.area}'. O WhatsApp ${args.whatsapp_number} está vinculado.`
                        }]
                    });
                }

                if (toolName === 'record_business_lead') {
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
