'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulating registration
        setTimeout(() => {
            setIsLoading(false);
            router.push('/');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3BC671] rounded-3xl shadow-2xl shadow-green-500/20 mb-4">
                        <span className="text-black text-4xl font-black italic">11</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Criar sua Conta</h1>
                    <p className="text-slate-400 font-medium">Eleve o nível do seu atendimento hoje</p>
                </div>

                <form onSubmit={handleRegister} className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#3BC671] focus:ring-1 focus:ring-[#3BC671] transition-all"
                            placeholder="Ex: Matheus Melo"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Melhor E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#3BC671] focus:ring-1 focus:ring-[#3BC671] transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Criar Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#3BC671] focus:ring-1 focus:ring-[#3BC671] transition-all"
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#3BC671] text-black font-black py-4 rounded-2xl shadow-xl shadow-green-500/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : 'CRIAR MINHA CONTA'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 font-medium">
                    Já tem conta?{' '}
                    <Link href="/login" className="text-[#3BC671] font-black hover:underline">Fazer login</Link>
                </p>
            </div>
        </div>
    );
}
