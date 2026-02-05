"use client";

import React, { useState, useEffect } from 'react';

const API_PREFIX = "/api";

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');

  const [activeTab, setActiveTab] = useState<'dash' | 'agents'>('dash');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({ total_conversations: 0, total_leads: 0, conversion_rate: '0%' });
  const [interactions, setInteractions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // Setup State
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState('');
  const [botName, setBotName] = useState('');
  const [area, setArea] = useState('');
  const [prompt, setPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [language, setLanguage] = useState('pt');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
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
      const [statsRes, interRes, agentsRes] = await Promise.all([
        fetch(`${API_PREFIX}/stats`, { headers }),
        fetch(`${API_PREFIX}/interactions`, { headers }),
        fetch(`${API_PREFIX}/agents`, { headers })
      ]);
      setStats(await statsRes.json());
      setInteractions(await interRes.json());
      setAgents(await agentsRes.json());
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

  const resetForm = () => {
    setEditingAgentId(null);
    setAgentId('');
    setBotName('');
    setArea('');
    setPrompt('');
    setFirstMessage('');
    setLanguage('pt');
    setEntities([{ id: 1, name: 'nome_cliente', description: 'Nome do cliente' }]);
  };

  const openNewAgentDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (agent: any) => {
    setEditingAgentId(agent.id);
    setAgentId(agent.agent_id || '');
    setBotName(agent.bot_name || '');
    setArea(agent.area || '');
    setPrompt(agent.prompt || '');
    setFirstMessage(agent.first_message || '');
    setLanguage(agent.language || 'pt');
    setEntities(agent.entities || [{ id: 1, name: 'nome_cliente', description: 'Nome do cliente' }]);
    setIsDrawerOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!botName || !area) return alert("Por favor, preencha os campos obrigatórios.");
    setLoading(true);
    try {
      const endpoint = editingAgentId ? `${API_PREFIX}/agent/setup` : `${API_PREFIX}/agent/create`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          agent_id: agentId,
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
        alert(editingAgentId ? "✅ Agente atualizado!" : "🎉 Novo agente criado!");
        setIsDrawerOpen(false);
        fetchData();
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-12 border border-slate-100">
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 bg-green-500 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-green-200 ring-8 ring-green-50">11</div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 text-center tracking-tight">Eleven Chat</h1>
          <p className="text-slate-400 text-center mb-10 font-bold uppercase text-[10px] tracking-[0.2em]">Revenue Intelligence Platform</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all text-slate-800 placeholder:text-slate-300 font-medium" placeholder="nome@agencia.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all text-slate-800 font-medium" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 transform active:scale-[0.98] mt-4">
              Acessar Ecossistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 font-sans flex flex-col pt-0 lg:pt-0">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/50 px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-green-200">11</div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Eleven Chat</h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600/60">Professional</span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden md:flex gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
              <button onClick={() => setActiveTab('dash')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dash' ? 'bg-white text-green-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('agents')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'agents' ? 'bg-white text-green-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Meus Agentes</button>
            </div>
            <button onClick={handleLogout} className="bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-10">
        {activeTab === 'dash' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Visão Geral</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Performance em Tempo Real</p>
              </div>
              <div className="flex bg-white px-6 py-3 rounded-2xl border border-slate-200/50 shadow-sm gap-4 items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Sincronizado com ElevenLabs</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Conversas Ativas', val: stats.total_conversations, color: 'text-slate-900', bg: 'bg-white', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
                { label: 'Leads Qualificados', val: stats.total_leads, color: 'text-green-600', bg: 'bg-white', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
                { label: 'Conversão Comercial', val: stats.conversion_rate, color: 'text-green-600', bg: 'bg-green-600 text-white', icon: 'M23 6l-9.5 9.5-5-5L1 18' }
              ].map((card, i) => (
                <div key={i} className={`${card.bg} p-10 rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border ${i === 2 ? 'border-green-600' : 'border-white'} group hover:transform hover:translate-y-[-5px] transition-all duration-500 cursor-default overflow-hidden relative`}>
                  <div className="relative z-10">
                    <div className={`mb-6 p-3 rounded-2xl w-fit ${i === 2 ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-green-50'}`}>
                      <svg className={i === 2 ? 'text-white' : 'text-slate-400 group-hover:text-green-500'} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={card.icon} /></svg>
                    </div>
                    <p className={i === 2 ? 'text-green-100 text-xs font-black uppercase tracking-widest mb-1' : 'text-slate-400 text-xs font-black uppercase tracking-widest mb-1'}>{card.label}</p>
                    <p className={`text-6xl font-black ${card.color}`}>{card.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactions Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-white rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.02)] border border-white p-12">
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-2xl font-black tracking-tight">Histórico de Fluxo</h2>
                  <button onClick={fetchData} className="p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {interactions.map((i: any) => (
                    <div key={i.conversation_id} className="group bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 hover:bg-white hover:shadow-[0_25px_50px_rgba(0,0,0,0.06)] hover:border-transparent transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-slate-700 font-bold text-lg leading-snug line-clamp-2 max-w-[80%]">{i.summary}</p>
                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${i.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-slate-200/50 text-slate-500'}`}>
                          {i.sentiment || 'Neutro'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {i.extracted_data && Object.entries(i.extracted_data).map(([key, val]: [string, any]) => (
                          <div key={key} className="bg-white border border-slate-200/60 px-4 py-2 rounded-2xl shadow-sm group-hover:border-green-100">
                            <span className="text-[10px] text-slate-400 font-black uppercase mr-3">{key.replace('_', ' ')}</span>
                            <span className="text-[11px] text-slate-800 font-black">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {interactions.length === 0 && (
                    <div className="text-center py-32 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                      <div className="text-slate-300 font-black text-sm uppercase tracking-widest italic">Nenhum fluxo capturado</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-10">
                <div className="bg-green-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-green-200 overflow-hidden relative">
                  <svg className="absolute top-[-20px] right-[-20px] text-white/10 w-40 h-40" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <h3 className="text-2xl font-black mb-4 relative z-10 leading-tight">Vantagem ElevenLabs AI</h3>
                  <p className="text-green-100 text-sm font-bold leading-relaxed relative z-10 mb-8">Todos os seus agentes usam o motor de voz mais avançado do mundo por padrão.</p>
                  <button onClick={openNewAgentDrawer} className="bg-white text-green-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-green-800/20">Novo Assistente</button>
                </div>

                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Log de Acessos
                  </h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map(id => (
                      <div key={id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400">#0{id}</div>
                        <div className="flex-1">
                          <div className="text-[11px] font-black text-slate-900">Login Efetuado</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">14:02 · Brasil</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Meus Agentes</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Biblioteca de Atendimento</p>
              </div>
              <button
                onClick={openNewAgentDrawer}
                className="bg-green-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.1em] hover:bg-green-700 transition-all shadow-2xl shadow-green-200 transform active:scale-95 flex items-center gap-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Contratar Novo Agente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {agents.map((agent: any) => (
                <div key={agent.id} className="bg-white rounded-[3.5rem] p-10 shadow-[0_20px_40px_rgba(0,0,0,0.02)] border border-white hover:border-green-100 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 translate-y-[-16px] group-hover:bg-green-50 transition-colors"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-10">
                      <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-3xl text-3xl shadow-sm border border-slate-100 group-hover:scale-110 transition-all">🤖</div>
                      <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${agent.agent_id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                          {agent.agent_id ? "Ativo" : "Pendente"}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 truncate">{agent.bot_name || "Agente sem nome"}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">{agent.area || "Sem setor definido"}</p>

                    <div className="mt-auto flex gap-3 pt-6 border-t border-slate-50">
                      <button onClick={() => openEditDrawer(agent)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Configurar</button>
                      <button onClick={() => { setAgentId(agent.agent_id); setShowTest(true); }} className="w-14 h-11 bg-green-50 text-green-600 flex items-center justify-center rounded-2xl hover:bg-green-600 hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100">
                  <p className="text-slate-300 font-black text-sm uppercase tracking-widest italic mb-6">Sua agência de IA está vazia</p>
                  <button onClick={openNewAgentDrawer} className="text-green-600 font-black text-xs uppercase tracking-widest bg-green-50 px-8 py-3 rounded-xl hover:bg-green-100 transition-all">+ Criar Primeiro</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* RIGHT DRAWER / SIDEBAR FOR AGENT CREATION */}
      <div className={`fixed inset-0 z-50 transition-all duration-500 ease-in-out ${isDrawerOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsDrawerOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out p-12 overflow-y-auto ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{editingAgentId ? "Ajustar Agente" : "Contratar Agente"}</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{editingAgentId ? "Atualizando inteligência" : "Defina as habilidades da sua IA"}</p>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} className="bg-slate-50 text-slate-300 hover:text-red-500 w-12 h-12 flex items-center justify-center rounded-2xl transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Codinome Digital</label>
                <input value={botName} onChange={(e) => setBotName(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-5 outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm" placeholder="Ex: Maria" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade</label>
                <input value={area} onChange={(e) => setArea(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-5 outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm" placeholder="Ex: Vendas" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diretrizes de Personalidade</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 leading-relaxed shadow-sm" placeholder="Como o assistente deve se comportar?" />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saudação Inicial</label>
              <input value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-[1.25rem] p-5 outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all font-bold text-slate-800 shadow-sm" placeholder="Ex: Olá! Como posso ajudar?" />
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocolos de Extração</label>
                <button className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-4 py-2 rounded-xl">+ Adicionar Campo</button>
              </div>
              <div className="grid gap-4">
                {entities.map((e: any) => (
                  <div key={e.id} className="flex gap-4 p-5 bg-slate-100/50 rounded-2xl border border-slate-200/50 group hover:border-green-200 transition-all">
                    <div className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded-xl text-[10px] font-black text-green-600">ID</div>
                    <div className="flex-1 space-y-1">
                      <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{e.name}</div>
                      <div className="text-[11px] font-bold text-slate-400 truncate">{e.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={loading} onClick={handleSaveAgent} className="w-full bg-green-600 text-white py-6 rounded-[2rem] font-black text-lg hover:bg-green-700 transition-all shadow-[0_20px_40px_rgba(22,163,74,0.2)] transform active:scale-[0.98] flex items-center justify-center gap-4 mt-12">
              {loading ? (
                <span className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {editingAgentId ? "Salvar Alterações" : "Ativar Assistente"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Test Modal (ElevenLabs Convai) */}
      {showTest && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowTest(false)}>
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sala de Testes: {botName}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ambiente Seguro ElevenLabs</p>
              </div>
              <button onClick={() => setShowTest(false)} className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="min-h-[500px] w-full bg-white relative flex items-center justify-center p-10">
              <div className="scale-125">
                {agentId && <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>}
                <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
