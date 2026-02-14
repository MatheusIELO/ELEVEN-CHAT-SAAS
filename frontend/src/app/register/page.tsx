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
            const mockUid = btoa(email).slice(0, 10);
            localStorage.setItem('eleven_user', mockUid);
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

                <div className="bg-white/5 border border-white/10 p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Acesso Restrito</h2>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                        O Eleven Chat está em fase de implantação exclusiva. Novas contas estão suspensas para garantir a estabilidade da rede.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block w-full bg-slate-800 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-700 transition-all text-sm uppercase tracking-widest"
                    >
                        Voltar ao Login
                    </Link>
                </div>

                <p className="text-center text-sm text-slate-500 font-medium">
                    Já tem conta?{' '}
                    <Link href="/login" className="text-[#3BC671] font-black hover:underline">Fazer login</Link>
                </p>
            </div>
        </div>
    );
}
