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
  const [apiStatus, setApiStatus] = useState<any>(null);

  // Setup State
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState('');
  const [botName, setBotName] = useState('');
  const [area, setArea] = useState('');
  const [prompt, setPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [language, setLanguage] = useState('pt');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  const [drawerStep, setDrawerStep] = useState(1);

  const KNOWLEDGE_TEMPLATES = [
    { id: 'company', label: 'Dados da Empresa', icon: '🏢', content: 'Nome da Empresa: \nCNPJ: \nEndereço: \nHorário de Atendimento: \nServiços/Produtos: ' },
    { id: 'faq', label: 'FAQ', icon: '❓', content: 'Q: Como funciona? \nA: ... \n\nQ: Qual o prazo? \nA: ...' },
    { id: 'vendas', label: 'Script de Vendas', icon: '💰', content: 'Apresentação: \nBenefícios: \nPreços: \nQuebra de Objeções: ' }
  ];
  const [entities, setEntities] = useState([
    { id: 1, name: 'customer_name', description: 'Nome completo do cliente' },
    { id: 2, name: 'customer_email', description: 'E-mail de contato' },
    { id: 3, name: 'customer_phone', description: 'Telefone ou WhatsApp' }
  ]);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [showTest, setShowTest] = useState(false);

  // Automation State
  const [autoEmail, setAutoEmail] = useState('');
  const [autoPassword, setAutoPassword] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [automationId, setAutomationId] = useState<string | null>(null);
  const [automationData, setAutomationData] = useState<any>(null);
  const [otpValue, setOtpValue] = useState('');
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

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
      const [statsRes, interRes, agentsRes, statusRes] = await Promise.all([
        fetch(`${API_PREFIX}/stats`, { headers }),
        fetch(`${API_PREFIX}/interactions`, { headers }),
        fetch(`${API_PREFIX}/agents`, { headers }),
        fetch(`${API_PREFIX}/`, { headers })
      ]);
      setStats(await statsRes.json());
      setInteractions(await interRes.json());
      setAgents(await agentsRes.json());
      setApiStatus(await statusRes.json());
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
    setAutomationId(null);
    setAutomationData(null);
    setOtpValue('');
    setDrawerStep(1);
  };

  const openNewAgentDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
    setDrawerStep(1);
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
    setAutomationId(null);
    setAutomationData(null);
    setIsDrawerOpen(true);
    setDrawerStep(1);
  };

  const checkAutomationStatus = async (id: string) => {
    try {
      const res = await fetch(`${API_PREFIX}/automation/whatsapp/status/${id}`, {
        headers: { 'user-id': userId }
      });
      const data = await res.json();
      setAutomationData(data);
      if (data.status === 'success' || data.status === 'failed') {
        setAutomationId(null);
        setIsAutoConnecting(false);
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (automationId) {
      interval = setInterval(() => checkAutomationStatus(automationId), 5000);
    }
    return () => clearInterval(interval);
  }, [automationId]);

  const handleStartAutomation = async () => {
    if (!autoEmail || !autoPassword || !targetPhone) return alert("Preencha email, senha e telefone para automação.");
    setIsAutoConnecting(true);
    try {
      const res = await fetch(`${API_PREFIX}/automation/whatsapp/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          agent_id: agentId,
          email: autoEmail,
          password: autoPassword,
          phone: targetPhone
        })
      });
      const data = await res.json();
      setAutomationId(data.automation_id);
    } catch (err) {
      alert("Erro ao iniciar automação.");
      setIsAutoConnecting(false);
    }
  };

  const handleSubmitOTP = async () => {
    if (!otpValue || !automationId) return;
    try {
      await fetch(`${API_PREFIX}/automation/whatsapp/submit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          automation_id: automationId,
          otp_code: otpValue
        })
      });
      alert("Código enviado! Aguardando o bot processar...");
      setOtpValue('');
    } catch (err) {
      alert("Erro ao enviar código.");
    }
  };

  const addEntity = () => setEntities((prev: any) => [...prev, { id: Date.now(), name: '', description: '' }]);
  const updateEntity = (id: number, field: 'name' | 'description', value: string) => setEntities((prev: any) => prev.map((e: any) => e.id === id ? { ...e, [field]: value } : e));
  const removeEntity = (id: number) => setEntities((prev: any) => prev.filter((e: any) => e.id !== id));

  const applyTemplate = (content: string) => {
    setPrompt(prev => prev ? prev + '\n\n' + content : content);
  };

  const handleSaveAgent = async () => {
    if (!botName || !area || !targetPhone) return alert("Por favor, preencha os campos obrigatórios (Nome, Área e WhatsApp).");
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
          whatsapp_number: targetPhone,
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

              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${apiStatus?.firebase_connected ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 7v10c0 2.21 4.477 4 10 4s10-1.79 10-4V7M4 7c0 2.21 4.477 4 10 4s10-1.79 10-4M4 7c0-2.21 4.477-4 10-4s10 1.79 10 4m0 5c0 2.21-4.477 4-10 4s-10-1.79-10-4" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Banco de Dados</p>
                      <h4 className="font-bold text-slate-900">Google Firebase</h4>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${apiStatus?.firebase_connected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {apiStatus?.firebase_connected ? 'Conectado' : 'Erro'}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${apiStatus?.elevenlabs_configured ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.574.345l-.367-.073a5 5 0 01-3.127-2.062l-.25-.375a3 3 0 00-2.323-1.428l-2.736-.205a2 2 0 11.298-3.989l2.736.205a5 5 0 013.871 2.381l.25.375a3 3 0 001.876 1.237l.367.073a6 6 0 003.86-.517l.675-.337a4 4 0 012.574-.345l2.387.477a4 4 0 012.554 1.368L19.428 15.428z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motor de Voz</p>
                      <h4 className="font-bold text-slate-900">ElevenLabs API</h4>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${apiStatus?.elevenlabs_configured ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {apiStatus?.elevenlabs_configured ? 'Ativo' : 'Pendente'}
                  </div>
                </div>
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
      {
        isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in transition-all" onClick={() => setIsDrawerOpen(false)} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-500">
              <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingAgentId ? 'Ajustes do Agente' : 'Novo Agente'}</h2>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4].map(s => (
                      <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${drawerStep >= s ? 'bg-[#3BC671]' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {drawerStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 1: Identidade</h3>
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mensagem de Saudação</label>
                      <input value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-semibold text-sm" placeholder="Primeira frase do robô..." />
                    </div>
                  </div>
                )}

                {drawerStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 2: Conhecimento</h3>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Templates Rápidos</label>
                      <div className="flex gap-2">
                        {KNOWLEDGE_TEMPLATES.map(t => (
                          <button key={t.id} onClick={() => applyTemplate(t.content)} className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl hover:border-[#3BC671] transition-all text-left group">
                            <span className="text-lg block mb-1">{t.icon}</span>
                            <span className="text-[10px] font-bold text-slate-600 block leading-tight">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instruções e Personalidade</label>
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all font-medium text-sm text-slate-700 leading-relaxed resize-none" placeholder="Defina como o robô deve se comportar..." />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentos de Apoio</span>
                        <label className="cursor-pointer text-[10px] font-bold text-white bg-slate-900 px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors">
                          {uploadingFile ? 'Enviando...' : 'Subir Arquivo'}
                          <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.docx" disabled={uploadingFile} />
                        </label>
                      </div>
                      <div className="space-y-2">
                        {knowledgeDocuments.map(doc => (
                          <div key={doc.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center text-blue-500"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                            <p className="text-[11px] font-bold text-slate-900 flex-1 truncate">{doc.name}</p>
                            <button onClick={() => setKnowledgeDocuments(prev => prev.filter(d => d.id !== doc.id))} className="text-slate-300 hover:text-red-500 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {drawerStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 3: Inteligência</h3>
                      <button onClick={addEntity} className="text-[10px] font-bold text-[#3BC671] hover:underline">+ ADICIONAR CAMPO</button>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border-l-2 border-slate-200">
                      Defina quais informações o robô deve extrair durante a conversa para gerar relatórios estruturados.
                    </p>

                    <div className="space-y-3">
                      {entities.map(e => (
                        <div key={e.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 group relative">
                          <button onClick={() => removeEntity(e.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Nome da Variável</label>
                            <input value={e.name} onChange={ev => updateEntity(e.id, 'name', ev.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold outline-none focus:border-[#3BC671]" placeholder="Ex: orcamento_estimado" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Instrução de Coleta</label>
                            <input value={e.description} onChange={ev => updateEntity(e.id, 'description', ev.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs outline-none focus:border-[#3BC671]" placeholder="Ex: O valor que o cliente pretende investir" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {drawerStep === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 4: Automação WhatsApp</h3>

                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número do WhatsApp (Obrigatório)</label>
                        <input value={targetPhone} onChange={e => setTargetPhone(e.target.value)} type="text" placeholder="Ex: +5511999999999" className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-semibold text-sm placeholder:text-slate-300" />
                        <p className="text-[10px] text-slate-500 font-medium">Este número será usado para registrar seu agente no Meta e habilitar o atendimento automático.</p>
                      </div>
                    </div>

                    {editingAgentId ? (
                      <div className="space-y-4">
                        <div className="bg-[#0F1115] text-white p-6 rounded-2xl space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#3BC671] rounded-xl flex items-center justify-center text-black font-black">11</div>
                            <div>
                              <p className="text-xs font-bold">Bot Alpha v2.0</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Aguardando gatilho</p>
                            </div>
                          </div>

                          {!automationId && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <input value={autoEmail} onChange={e => setAutoEmail(e.target.value)} type="email" placeholder="Email ElevenLabs" className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-[#3BC671]" />
                                <input value={autoPassword} onChange={e => setAutoPassword(e.target.value)} type="password" placeholder="Senha ElevenLabs" className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-[#3BC671]" />
                              </div>
                              <button onClick={handleStartAutomation} disabled={isAutoConnecting} className="w-full bg-[#3BC671] text-black font-bold text-xs py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all">
                                {isAutoConnecting ? 'CONECTANDO...' : 'CONECTAR WHATSAPP VIA CLOUD'}
                              </button>
                            </>
                          )}

                          {automationId && automationData?.step === 'awaiting_otp' && (
                            <div className="space-y-3 bg-[#3BC671]/10 p-4 rounded-xl border border-[#3BC671]/20">
                              <p className="text-[10px] text-[#3BC671] font-bold uppercase tracking-widest">Código SMS Recebido:</p>
                              <div className="flex gap-2">
                                <input value={otpValue} onChange={e => setOtpValue(e.target.value)} type="text" maxLength={6} placeholder="000000" className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-center text-xl font-bold tracking-[0.3em] outline-none" />
                                <button onClick={handleSubmitOTP} className="bg-[#3BC671] text-black px-6 rounded-lg font-bold text-xs">ENVIAR</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-sm font-bold text-slate-400">Primeiro salve o agente para habilitar a automação de canal.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <footer className="p-8 border-t border-slate-100 bg-white flex gap-3">
                {drawerStep > 1 && (
                  <button onClick={() => setDrawerStep(s => s - 1)} className="px-6 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                    Voltar
                  </button>
                )}
                {drawerStep < 4 ? (
                  <button onClick={() => setDrawerStep(s => s + 1)} className="flex-1 bg-[#3BC671] text-black p-4 rounded-xl font-bold text-sm hover:brightness-110 shadow-lg shadow-green-500/10 transition-all active:scale-[0.98]">
                    Continuar
                  </button>
                ) : (
                  <button disabled={loading} onClick={handleSaveAgent} className="flex-1 bg-slate-900 text-white p-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : (editingAgentId ? 'Salvar Alterações' : 'Finalizar e Criar Agente')}
                  </button>
                )}
              </footer>
            </div>
          </div>
        )
      }

      {/* Test Modal */}
      {
        showTest && (
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
        )
      }
    </div>
  );
}
