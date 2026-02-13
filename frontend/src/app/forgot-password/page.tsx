'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulating password reset email
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3BC671] rounded-3xl shadow-2xl shadow-green-500/20 mb-4">
                        <span className="text-black text-4xl font-black italic">11</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Recuperar Acesso</h1>
                    <p className="text-slate-400 font-medium">Enviaremos um link de recuperação para seu e-mail</p>
                </div>

                {!isSent ? (
                    <form onSubmit={handleReset} className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Cadastro</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#3BC671] focus:ring-1 focus:ring-[#3BC671] transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#3BC671] text-black font-black py-4 rounded-2xl shadow-xl shadow-green-500/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : 'ENVIAR LINK DE RECOVERY'}
                        </button>

                        <Link href="/login" className="block text-center text-xs font-bold text-slate-500 hover:text-white transition-colors">
                            Voltar para o login
                        </Link>
                    </form>
                ) : (
                    <div className="bg-white/5 border border-white/10 p-10 rounded-3xl shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="w-16 h-16 bg-[#3BC671]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-8 h-8 text-[#3BC671]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-white">E-mail Enviado!</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">Verifique sua caixa de entrada (e o spam) para o link de alteração de senha.</p>
                        <Link href="/login" className="block w-full bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all">
                            VOLTAR AO LOGIN
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
