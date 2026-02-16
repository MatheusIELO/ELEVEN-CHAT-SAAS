// Armazenamento temporário em memória para respostas assíncronas
// Em produção, isso deveria ser Redis ou similar
const pendingResponses = new Map<string, {
    status: 'processing' | 'completed' | 'error';
    text?: string;
    audioChunks?: string[];
    userTranscript?: string;
    error?: string;
}>();

export function setPendingResponse(requestId: string, data: any) {
    pendingResponses.set(requestId, data);
    // Limpar após 5 minutos para evitar vazamento de memória
    setTimeout(() => pendingResponses.delete(requestId), 5 * 60 * 1000);
}

export function getPendingResponse(requestId: string) {
    return pendingResponses.get(requestId);
}

export function deletePendingResponse(requestId: string) {
    pendingResponses.delete(requestId);
}
