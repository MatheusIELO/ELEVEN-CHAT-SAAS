import React from 'react';

export default function PrivacidadePage() {
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
                    <h1 className="text-5xl font-black tracking-tight leading-none text-slate-900">Política de Privacidade</h1>
                    <p className="text-slate-500 font-medium italic">Última atualização: 14 de Fevereiro de 2026</p>
                </header>

                <section className="prose prose-slate max-w-none space-y-8 text-slate-600 font-medium">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">1. Coleta de Dados</h2>
                        <p>
                            O Eleven Chat coleta informações necessárias para a integração de inteligência artificial via WhatsApp,
                            incluindo identificadores de números de telefone e metadados de mensagens processadas pelos nossos agentes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">2. Uso das Informações</h2>
                        <p>
                            Os dados coletados são utilizados exclusivamente para o funcionamento dos Agentes de IA,
                            garantindo que as respostas sejam contextualizadas e precisas. Não compartilhamos dados com terceiros para fins publicitários.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">3. Segurança</h2>
                        <p>
                            Implementamos medidas de segurança de nível empresarial para proteger seus identificadores
                            e os dados das conversas dos seus clientes. Utilizamos criptografia e APIs oficiais da Meta Cloud API.
                        </p>
                    </div>

                    <div className="space-y-4 border-l-4 border-[#3BC671] pl-6 py-2 bg-slate-50 rounded-r-[2rem]">
                        <p className="font-bold text-slate-900">
                            Ao utilizar o Eleven Chat, você concorda com a coleta e uso de informações de acordo com esta política.
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
