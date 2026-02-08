import { Mastra } from '@mastra/core';
import { browserUse } from './browser-use';

export const mastra = new Mastra({
    agents: [
        // Futuros agentes podem ser definidos aqui
    ],
});

// Helper para gerenciar o fluxo do Browser Use Cloud
export const whatsappAutomation = {
    async start(agentId: string, email: string, pwd: string, phone: string) {
        const session = await browserUse.sessions.createSession({});
        const task = await browserUse.tasks.createTask({
            sessionId: session.id,
            task: `
        Logue na ElevenLabs (${email}), vá no agente ${agentId}, 
        aba Integrations -> WhatsApp -> Conectar. 
        Avance até pedir o código SMS para o número ${phone}. 
        Se vir a tela de código, pare e finalize com: "Aguardando código".
      `,
        });
        return { sessionId: session.id, taskId: task.id };
    },

    async resume(sessionId: string, otp: string) {
        return await browserUse.tasks.createTask({
            sessionId,
            task: `Digite o código ${otp} e complete a conexão.`,
        });
    }
};
