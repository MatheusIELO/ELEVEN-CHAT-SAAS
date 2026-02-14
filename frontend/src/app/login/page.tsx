'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Admin Credentials check
        if (email === 'matheusdevff@gmail.com' && password === 'Griza1@') {
            setTimeout(() => {
                localStorage.setItem('eleven_user', 'admin_master');
                localStorage.setItem('eleven_email', email);
                setIsLoading(false);
                router.push('/');
            }, 1000);
            return;
        }

        // Generic mock for other users (for dev speed)
        if (email && password.length >= 6) {
            setTimeout(() => {
                const mockUid = btoa(email).slice(0, 10);
                localStorage.setItem('eleven_user', mockUid);
                localStorage.setItem('eleven_email', email);
                setIsLoading(false);
                router.push('/');
            }, 1000);
        } else {
            setIsLoading(false);
            setError('Credenciais inválidas ou senha muito curta.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3BC671] rounded-3xl shadow-2xl shadow-green-500/20 mb-4">
                        <span className="text-black text-4xl font-black italic">11</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Bem-vindo ao Eleven Chat</h1>
                    <p className="text-slate-400 font-medium">Faça login para gerenciar seus agentes de elite</p>
                </div>

                <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
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
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                            <Link href="/forgot-password" opacity-100 className="text-[10px] font-black text-[#3BC671] uppercase hover:underline">Esqueci a senha</Link>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#3BC671] focus:ring-1 focus:ring-[#3BC671] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#3BC671] text-black font-black py-4 rounded-2xl shadow-xl shadow-green-500/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : 'ENTRAR NO DASHBOARD'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 font-medium">
                    As novas contas estão temporariamente suspensas.{' '}
                    <span className="text-slate-400 font-black cursor-not-allowed">Cadastros fechados</span>
                </p>
            </div>
        </div>
    );
}
