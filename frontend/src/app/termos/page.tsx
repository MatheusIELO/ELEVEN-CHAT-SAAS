import React from 'react';

export default function TermosPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#3BC671]/30">
            {/* Header */}
            <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-black text-xl italic">11</span>
                        </div>
                        <span className="font-black text-xl tracking-tight uppercase">Eleven Chat</span>
                    </div>
                    <a href="/" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Voltar ao App</a>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-20 space-y-12">
                <header className="space-y-4">
                    <h1 className="text-5xl font-black tracking-tight leading-none text-slate-900">Termos de Uso</h1>
                    <p className="text-slate-500 font-medium italic">Última atualização: 14 de Fevereiro de 2026</p>
                </header>

                <section className="prose prose-slate max-w-none space-y-8 text-slate-600 font-medium">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e utilizar a plataforma Eleven Chat, você concorda em cumprir estes termos de serviço
                            e todas as leis e regulamentos aplicáveis à comunicação via WhatsApp Business API.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">2. Licença do Agente</h2>
                        <p>
                            O Eleven Chat concede a você uma licença limitada e não exclusiva para criar e gerenciar
                            Agentes de IA dentro da nossa plataforma para automação de atendimento comercial legítimo.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">3. Proibições</h2>
                        <p>
                            É estritamente proibido o uso da plataforma para envio de spam, conteúdo ilegal,
                            assédio ou qualquer atividade que viole os termos de uso oficiais da Meta Cloud API.
                        </p>
                    </div>

                    <div className="space-y-4 bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3BC671] blur-[80px] opacity-10"></div>
                        <p className="text-white text-sm relative z-10 leading-relaxed">
                            O descumprimento destes termos poderá resultar na suspensão imediata da conta e na desconexão dos agentes integrados.
                        </p>
                    </div>
                </section>

                <footer className="pt-20 border-t border-slate-100 italic text-sm text-slate-400">
                    © 2026 Eleven Chat - Todos os direitos reservados.
                </footer>
            </main>
        </div>
    );
}
