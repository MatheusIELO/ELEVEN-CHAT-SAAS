"use client";

import React, { useState, useEffect } from 'react';

// Agora usamos caminhos relativos pois o backend está no mesmo projeto (Next.js API Routes)
const API_PREFIX = "/api";

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');

  const [activeTab, setActiveTab] = useState<'dash' | 'setup'>('dash');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total_conversations: 0, total_leads: 0, conversion_rate: '0%' });
  const [interactions, setInteractions] = useState<any[]>([]);

  // Setup State (Simplificado para o Cliente)
  const [agentId, setAgentId] = useState('');
  const [botName, setBotName] = useState('');
  const [area, setArea] = useState('');
  const [prompt, setPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [language, setLanguage] = useState('pt');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel default
  const [entities, setEntities] = useState([{ id: 1, name: 'nome_cliente', description: 'Nome do cliente' }]);

  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('eleven_user');
    if (savedUser) {
      setUserId(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const mockUid = btoa(email).slice(0, 10);
      localStorage.setItem('eleven_user', mockUid);
      setUserId(mockUid);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eleven_user');
    setIsLoggedIn(false);
  };

  const fetchData = async () => {
    if (!userId) return;
    try {
      const headers = { 'user-id': userId };
      const [statsRes, interRes] = await Promise.all([
        fetch(`${API_PREFIX}/stats`, { headers }),
        fetch(`${API_PREFIX}/interactions`, { headers })
      ]);
      setStats(await statsRes.json());
      setInteractions(await interRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, userId]);

  const handleCreateAgent = async () => {
    if (!botName || !area) return alert("Por favor, dê um nome ao seu assistente.");
    setLoading(true);
    try {
      const res = await fetch(`${API_PREFIX}/agent/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          bot_name: botName,
          area,
          prompt,
          first_message: firstMessage,
          language,
          voice_id: voiceId,
          entities: entities.filter(e => e.name && e.description)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAgentId(data.agent_id);
        alert("🎉 Assistente criado com sucesso!");
        setActiveTab('dash');
      } else {
        alert("Erro: " + data.detail);
      }
    } catch (e) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-10 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-green-200">11</div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center tracking-tight">Eleven Chat</h1>
          <p className="text-slate-500 text-center mb-8 font-medium">Sua IA de Atendimento Inteligente</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">E-mail de acesso</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-800 placeholder:text-slate-400" placeholder="exemplo@suaempresa.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Senha</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-800" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 transform active:scale-[0.98]">
              Entrar no Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-green-100">11</div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Eleven Chat</h1>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button onClick={() => setActiveTab('dash')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dash' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('setup')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'setup' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Assistente</button>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 text-sm font-semibold transition-colors">Sair</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'dash' ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Conversas', val: stats.total_conversations, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Leads Capturados', val: stats.total_leads, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Taxa de Conversão', val: stats.conversion_rate, color: 'text-purple-600', bg: 'bg-purple-50' }
              ].map((card, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{card.label}</p>
                  <p className={`text-5xl font-black ${card.color}`}>{card.val}</p>
                </div>
              ))}
            </div>

            {/* Interactions Log */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-extrabold tracking-tight">Últimas Interações</h2>
                <div className="text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full uppercase tracking-widest">Tempo Real</div>
              </div>

              <div className="grid gap-4">
                {interactions.map((i: any) => (
                  <div key={i.conversation_id} className="group bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-slate-700 font-medium leading-relaxed pr-6 line-clamp-2">{i.summary}</p>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${i.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {i.sentiment || 'Neutro'}
                      </span>
                    </div>
                    {i.extracted_data && Object.keys(i.extracted_data).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/50 group-hover:border-slate-100 transition-colors">
                        {Object.entries(i.extracted_data).map(([key, val]: [string, any]) => (
                          <div key={key} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="text-[10px] text-slate-400 font-bold uppercase mr-2">{key.replace('_', ' ')}:</span>
                            <span className="text-[11px] text-slate-800 font-extrabold">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {interactions.length === 0 && (
                  <div className="text-center py-24 text-slate-300 italic font-medium">Nenhuma conversa registrada ainda.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white p-12">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Configure sua IA</h2>
                  <p className="text-slate-500 text-sm font-medium">Preencha o perfil para dar vida ao seu assistente.</p>
                </div>
                <button
                  onClick={() => setShowTest(true)}
                  disabled={!agentId}
                  className={`px-8 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all transform active:scale-95 ${agentId ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  ⚡ Testar Agora
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome do Assistente</label>
                    <input value={botName} onChange={(e) => setBotName(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium" placeholder="Ex: Maria" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Segmento / Área</label>
                    <input value={area} onChange={(e) => setArea(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium" placeholder="Ex: Imobiliária" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">O que ele deve saber?</label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium" placeholder="Descreva o treinamento da IA aqui..." />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primeira Saudação</label>
                  <input value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium" placeholder="Olá! Sou a Maria, como posso ajudar?" />
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Dados para Coletar</label>
                    <button className="text-[10px] font-black uppercase text-green-600 hover:text-green-700">+ Adicionar</button>
                  </div>
                  <div className="grid gap-3">
                    {entities.map((e: any) => (
                      <div key={e.id} className="flex gap-2">
                        <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-xl text-[11px] font-bold text-green-700">{e.name}</div>
                        <div className="flex-1 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[11px] font-medium text-slate-500">{e.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button disabled={loading} onClick={handleCreateAgent} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 transform active:scale-[0.99] flex items-center justify-center gap-3">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "🚀 Ativar Inteligência"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Test Modal (ElevenLabs Convai) */}
      {showTest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Teste sua Assistente: {botName}</h3>
                <p className="text-xs text-slate-400 font-medium">Fale com ela para validar as respostas.</p>
              </div>
              <button onClick={() => setShowTest(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-black">×</button>
            </div>
            <div className="min-h-[450px] w-full bg-slate-50 relative flex items-center justify-center">
              <div className="scale-110">
                <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>
                <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
