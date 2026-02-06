"use client";

import React, { useState, useEffect } from 'react';

const API_PREFIX = "/api/v1";

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');

  const [activeTab, setActiveTab] = useState<'dash' | 'agents' | 'logs'>('dash');
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
  const [entities, setEntities] = useState([
    { id: 1, name: 'customer_name', description: 'Nome completo do cliente' },
    { id: 2, name: 'customer_email', description: 'E-mail de contato' },
    { id: 3, name: 'customer_phone', description: 'Telefone ou WhatsApp' }
  ]);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

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
    setEntities([
      { id: 1, name: 'customer_name', description: 'Nome completo do cliente' },
      { id: 2, name: 'customer_email', description: 'E-mail de contato' },
      { id: 3, name: 'customer_phone', description: 'Telefone ou WhatsApp' }
    ]);
    setKnowledgeDocuments([]);
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
    setEntities(agent.entities || [
      { id: 1, name: 'customer_name', description: 'Nome completo do cliente' },
      { id: 2, name: 'customer_email', description: 'E-mail de contato' },
      { id: 3, name: 'customer_phone', description: 'Telefone ou WhatsApp' }
    ]);
    setKnowledgeDocuments(agent.knowledge_base?.map((id: string) => ({ id, name: 'Doc: ' + id.slice(-6) })) || []);
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
          entities: entities.filter(e => e.name && e.description),
          knowledge_base: knowledgeDocuments.map(doc => doc.id)
        })
      });
      const data = await res.json();
      if (res.ok) {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const res = await fetch(`${API_PREFIX}/knowledge/upload`, {
        method: 'POST',
        headers: { 'user-id': userId },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setKnowledgeDocuments(prev => [...prev, { id: data.documentation_id, name: file.name }]);
      } else {
        alert("Erro no upload: " + data.detail);
      }
    } catch (err) {
      alert("Erro ao enviar arquivo.");
    } finally {
      setUploadingFile(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-6 font-sans antialiased text-white">
        <div className="max-w-md w-full bg-[#181A20] rounded-2xl shadow-2xl p-10 border border-[#2A2E37]">
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-[#3BC671] rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-green-500/20">11</div>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-center tracking-tight">Bem-vindo ao Eleven Chat</h1>
          <p className="text-slate-500 text-center mb-10 text-sm font-medium">Inteligência Conversacional Profissional</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail Profissional</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full bg-[#23262F] border border-[#2A2E37] rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all text-sm placeholder:text-slate-600" placeholder="voce@empresa.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Senha</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="w-full bg-[#23262F] border border-[#2A2E37] rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all text-sm placeholder:text-slate-600" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-[#3BC671] text-black py-4 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#3BC671]/10 mt-4 active:scale-[0.99]">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0F1115] font-sans antialiased flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#0F1115] text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 mb-4">
          <div className="w-8 h-8 bg-[#3BC671] rounded-lg flex items-center justify-center text-black font-black text-sm">11</div>
          <span className="font-bold tracking-tight text-lg">Eleven Chat</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dash', label: 'Painel Geral', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
            { id: 'agents', label: 'Agentes de Voz', icon: 'M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z' },
            { id: 'logs', label: 'Histórico e Leads', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === item.id ? 'bg-[#3BC671]/10 text-[#3BC671]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-colors">
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            {activeTab === 'dash' ? 'Visão Geral' : activeTab === 'agents' ? 'IA Conversacional' : 'Insights'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <div className="w-1.5 h-1.5 bg-[#3BC671] rounded-full"></div>
              Motor Ativo
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {activeTab === 'dash' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Compact Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Conversas', val: stats.total_conversations, sub: 'Total de interações processadas' },
                  { label: 'Leads Detectados', val: stats.total_leads, sub: 'Potenciais clientes qualificados' },
                  { label: 'Taxa de Conversão', val: stats.conversion_rate, sub: 'Benchmark de performance' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-2">{s.val}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Interaction Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
                  <h3 className="font-bold text-slate-900">Fluxo em Tempo Real</h3>
                  <button onClick={fetchData} className="text-slate-400 hover:text-slate-600">
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h.582M20 20v-5h-.581M18.46 6.54A9 9 0 0 1 20 12h-2M5.54 18.46A9 9 0 0 1 4 12h2" /></svg>
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {interactions.map(i => (
                    <div key={i.conversation_id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between gap-4 mb-3">
                        <div className="bg-slate-900 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded leading-none flex items-center h-fit">ID: {i.conversation_id.slice(-6)}</div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${i.sentiment === 'positive' ? 'text-[#3BC671]' : 'text-slate-400'}`}>{i.sentiment || 'Neutro'}</span>
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed mb-4">{i.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        {i.extracted_data && Object.entries(i.extracted_data).map(([k, v]: [string, any]) => (
                          <div key={k} className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{k.replace('_', ' ')}</span>
                            <span className="text-[11px] font-bold text-slate-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {interactions.length === 0 && (
                    <div className="p-12 text-center text-slate-400 font-semibold italic">Nenhum dado detectado para este usuário.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Meus Agentes</h3>
                  <p className="text-sm text-slate-500 font-medium">Gerencie e publique suas unidades conversacionais</p>
                </div>
                <button
                  onClick={openNewAgentDrawer}
                  className="bg-[#3BC671] text-black px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-green-500/10 hover:shadow-green-500/20 active:scale-95 transition-all text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Criar Agente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.map(agent => (
                  <div key={agent.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold relative">
                        {agent.bot_name?.[0]?.toUpperCase() || 'A'}
                        {agent.agent_id && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#3BC671] rounded-full border-2 border-white ring-2 ring-[#3BC671]/20"></div>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditDrawer(agent)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => { setAgentId(agent.agent_id); setBotName(agent.bot_name); setShowTest(true); }} className="p-2 text-slate-400 hover:text-[#3BC671] hover:bg-green-50 rounded-lg transition-all">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{agent.bot_name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 border-b border-slate-100 pb-4">{agent.area}</p>
                    <div className="h-20 overflow-hidden relative">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-3">"{agent.prompt}"</p>
                      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>
                  </div>
                ))}
                {agents.length === 0 && (
                  <div className="col-span-full py-20 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group">
                    <p className="font-bold text-sm tracking-tight mb-4">Nenhum agente ativo encontrado</p>
                    <button onClick={openNewAgentDrawer} className="text-[#3BC671] font-bold text-xs uppercase tracking-widest border border-[#3BC671]/30 px-6 py-2 rounded-lg hover:bg-white transition-all">Configurar primeiro agente</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">ID da Transação</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Sentimento</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Resumo da Conversa</th>
                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interactions.map(i => (
                    <tr key={i.conversation_id} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">#{i.conversation_id.slice(-8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${i.sentiment === 'positive' ? 'bg-[#3BC671]/10 text-[#3BC671]' : 'bg-slate-100 text-slate-400'}`}>{i.sentiment || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium truncate max-w-[300px]">{i.summary}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 px-3 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all">DETALHES</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Drawer - Ultra Sleek */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in transition-all" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-500">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingAgentId ? 'Ajustes do Agente' : 'Novo Agente'}</h2>
                <p className="text-xs text-slate-500 font-medium">{editingAgentId ? 'Configurando instância ativa' : 'Inicializando nova unidade conversacional'}</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Ativo</label>
                  <input value={botName} onChange={(e) => setBotName(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-semibold text-sm placeholder:text-slate-300" placeholder="Ex: Maria IA" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Domínio de Negócio</label>
                  <input value={area} onChange={(e) => setArea(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-semibold text-sm placeholder:text-slate-300" placeholder="Ex: Vendas" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personalidade e Base de Conhecimento</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all font-medium text-sm text-slate-700 leading-relaxed resize-none" placeholder="Instruções para o comportamento do modelo..." />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mensagem de Saudação</label>
                <input value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-semibold text-sm" placeholder="Primeira frase do robô..." />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolos de Extração de Dados</span>
                  <button className="text-[10px] font-bold text-black bg-[#3BC671] px-3 py-1 rounded-lg">ATIVO</button>
                </div>
                <div className="space-y-2">
                  {entities.map(e => (
                    <div key={e.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 group">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-[#3BC671] transition-colors uppercase">{e.name.slice(0, 2)}</div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-900 leading-none mb-1">{e.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{e.description}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-medium italic">Dados capturados automaticamente por padrão na ElevenLabs</p>
                  </div>
                </div>
              </div>

              {/* Knowledge Base Documents */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Conhecimento (Documentos)</span>
                  <label className="cursor-pointer text-[10px] font-bold text-white bg-slate-900 px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors">
                    {uploadingFile ? 'Enviando...' : 'Subir Arquivo'}
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.docx" disabled={uploadingFile} />
                  </label>
                </div>
                <div className="space-y-2">
                  {knowledgeDocuments.map(doc => (
                    <div key={doc.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-900 leading-none truncate">{doc.name}</p>
                        <p className="text-[10px] text-[#3BC671] font-bold uppercase mt-1">Sincronizado</p>
                      </div>
                      <button onClick={() => setKnowledgeDocuments(prev => prev.filter(d => d.id !== doc.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  {knowledgeDocuments.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-[11px] text-slate-400 font-medium">Nenhum documento adicionado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="p-8 border-t border-slate-100 bg-slate-50/50">
              <button disabled={loading} onClick={handleSaveAgent} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : (editingAgentId ? 'Atualizar Instância' : 'Inicializar Agente')}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6" onClick={() => setShowTest(false)}>
          <div className="bg-[#181A20] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-[#2A2E37]" onClick={e => e.stopPropagation()}>
            <div className="p-8 flex justify-between items-center border-b border-[#2A2E37]">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Ambiente de Teste: {botName}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Janela de inferência em tempo real</p>
              </div>
              <button onClick={() => setShowTest(false)} className="w-10 h-10 rounded-xl bg-[#23262F] border border-[#2A2E37] flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="h-[450px] w-full bg-[#0F1115] relative flex items-center justify-center">
              <div className="scale-110">
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
