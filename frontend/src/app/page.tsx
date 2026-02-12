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
  const [metrics, setMetrics] = useState<any>(null);

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

  // New "Superpowers" State
  const [companyHistory, setCompanyHistory] = useState('');
  const [productsCatalog, setProductsCatalog] = useState<Array<{ name: string, price: string, desc: string }>>([]);
  const [paymentMethods, setPaymentMethods] = useState('');
  const [deliveryCosts, setDeliveryCosts] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [blockedSubjects, setBlockedSubjects] = useState<string[]>([]);

  const KNOWLEDGE_TEMPLATES = [
    { id: 'company', label: 'Dados da Empresa', icon: '🏢', content: 'Nome da Empresa: \nCNPJ: \nEndereço: \nHorário de Atendimento: \nServiços/Produtos: ' },
    { id: 'faq', label: 'FAQ', icon: '❓', content: 'Q: Como funciona? \nA: ... \n\nQ: Qual o prazo? \nA: ...' },
    { id: 'vendas', label: 'Script de Vendas', icon: '💰', content: 'Apresentação: \nBenefícios: \nPreços: \nQuebra de Objeções: ' }
  ];
  const [entities, setEntities] = useState([
    { id: 1, name: 'customer_name', description: 'Nome completo do cliente' },
    { id: 2, name: 'customer_email', description: 'E-mail de contato' },
    { id: 3, name: 'customer_phone', description: 'Telefone ou WhatsApp' },
    { id: 4, name: 'customer_region', description: 'Cidade, estado ou região do cliente' }
  ]);

  const SUGGESTED_ENTITIES = [
    { name: 'orcamento_estimado', description: 'Valor que o cliente pretende investir' },
    { name: 'produto_interesse', description: 'Qual produto ou serviço específico o cliente busca' },
    { name: 'motivo_contato', description: 'Principal dor ou necessidade do cliente' },
    { name: 'origem_lead', description: 'Por onde o cliente conheceu a empresa (Instagram, Google, indicação)' }
  ];
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [showTest, setShowTest] = useState(false);

  // WhatsApp Connection State
  const [isWADrawerOpen, setIsWADrawerOpen] = useState(false);
  const [waAgent, setWaAgent] = useState<any>(null);
  const [connectionMode, setConnectionMode] = useState<'automation' | 'native'>('automation');

  // Automation State
  const [autoEmail, setAutoEmail] = useState('');
  const [autoPassword, setAutoPassword] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [automationId, setAutomationId] = useState<string | null>(null);
  const [automationData, setAutomationData] = useState<any>(null);
  const [otpValue, setOtpValue] = useState('');
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  // Native Meta State (Route 1)
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');
  const [isSavingNative, setIsSavingNative] = useState(false);


  // Chat Test State (WhatsApp Style)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string, timestamp: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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
      const [statsRes, interRes, agentsRes, statusRes, metricsRes] = await Promise.all([
        fetch(`${API_PREFIX}/stats`, { headers }),
        fetch(`${API_PREFIX}/interactions`, { headers }),
        fetch(`${API_PREFIX}/agents`, { headers }),
        fetch(`${API_PREFIX}/`, { headers }),
        fetch(`${API_PREFIX}/metrics`, { headers })
      ]);
      setStats(await statsRes.json());
      setInteractions(await interRes.json());
      setAgents(await agentsRes.json());
      setApiStatus(await statusRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleDeleteAgent = async (id: string, agent_id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar este agente? Esta ação removerá o agente do ElevenLabs e não pode ser desfeita.")) return;
    try {
      const res = await fetch(`${API_PREFIX}/agent/delete?agentId=${agent_id}`, {
        method: 'DELETE',
        headers: { 'user-id': userId }
      });
      if (res.ok) {
        setAgents(prev => prev.filter(a => a.agent_id !== agent_id));
        alert("Agente removido com sucesso!");
      } else {
        alert("Erro ao remover agente.");
      }
    } catch (err) {
      alert("Erro na conexão ao deletar.");
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
    setFirstMessage('Olá! Como posso ajudar você hoje?');
    setLanguage('pt');
    setEntities([
      { id: 1, name: 'customer_name', description: 'Nome completo do cliente' },
      { id: 2, name: 'customer_email', description: 'E-mail de contato' },
      { id: 3, name: 'customer_phone', description: 'Telefone ou WhatsApp' },
      { id: 4, name: 'customer_region', description: 'Cidade, estado ou região do cliente' }
    ]);
    setKnowledgeDocuments([]);
    setCompanyHistory('');
    setProductsCatalog([]);
    setPaymentMethods('');
    setDeliveryCosts('');
    setOpeningHours('');
    setBlockedSubjects([]);
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
    setPrompt(agent.prompt_user_part || agent.prompt || ''); // Try to get the raw user part if we stored it
    setFirstMessage(agent.first_message || '');
    setLanguage(agent.language || 'pt');
    setVoiceId(agent.voice_id || '21m00Tcm4TlvDq8ikWAM');
    setEntities(agent.entities || [
      { id: 1, name: 'customer_name', description: 'Nome completo do cliente' },
      { id: 2, name: 'customer_email', description: 'E-mail de contato' },
      { id: 3, name: 'customer_phone', description: 'Telefone ou WhatsApp' },
      { id: 4, name: 'customer_region', description: 'Cidade, estado ou região do cliente' }
    ]);

    // Fill new superpowers
    setCompanyHistory(agent.company_history || '');
    setProductsCatalog(agent.products_catalog || []);
    setPaymentMethods(agent.payment_methods || '');
    setDeliveryCosts(agent.delivery_costs || '');
    setOpeningHours(agent.opening_hours || '');
    setBlockedSubjects(agent.blocked_subjects || []);

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

  const handleSaveNativeConfig = async () => {
    if (!metaAccessToken || !metaPhoneNumberId) return alert("Preencha o Access Token e o Phone Number ID.");
    setIsSavingNative(true);
    try {
      const res = await fetch(`${API_PREFIX}/agent/whatsapp/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          agent_id: waAgent.agent_id,
          whatsapp_config: {
            access_token: metaAccessToken,
            phone_number_id: metaPhoneNumberId,
            waba_id: metaWabaId,
            mode: 'native'
          }
        })
      });
      if (res.ok) {
        alert("Configuração salva com sucesso!");
        setIsWADrawerOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert("Erro ao salvar: " + error.detail);
      }
    } catch (err) {
      alert("Erro de rede ao salvar configuração.");
    } finally {
      setIsSavingNative(false);
    }
  };


  const addEntity = () => setEntities((prev: any) => [...prev, { id: Date.now(), name: '', description: '' }]);
  const updateEntity = (id: number, field: 'name' | 'description', value: string) => setEntities((prev: any) => prev.map((e: any) => e.id === id ? { ...e, [field]: value } : e));
  const removeEntity = (id: number) => setEntities((prev: any) => prev.filter((e: any) => e.id !== id));

  const applyTemplate = (content: string) => {
    setPrompt(prev => prev ? prev + '\n\n' + content : content);
  };

  const openWADrawer = (agent: any) => {
    setWaAgent(agent);
    setTargetPhone(agent.whatsapp_number || '');

    // Pre-fill native config if exists
    if (agent.whatsapp_config) {
      setConnectionMode(agent.whatsapp_config.mode || 'automation');
      setMetaAccessToken(agent.whatsapp_config.access_token || '');
      setMetaPhoneNumberId(agent.whatsapp_config.phone_number_id || '');
      setMetaWabaId(agent.whatsapp_config.waba_id || '');
    } else {
      setConnectionMode('automation');
      setMetaAccessToken('');
      setMetaPhoneNumberId('');
      setMetaWabaId('');
    }

    setIsWADrawerOpen(true);
  };

  const handleSaveAgent = async () => {

    if (!botName || !area) return alert("Por favor, preencha os campos obrigatórios (Nome e Área).");
    setLoading(true);

    try {
      const endpoint = editingAgentId ? `${API_PREFIX}/agent/setup` : `${API_PREFIX}/agent/create`;

      // Compile Superpowers into a Master Prompt
      const productsPart = productsCatalog.length > 0
        ? "\n\n### CATÁLOGO DE PRODUTOS E PREÇOS ###\n" + productsCatalog.filter(p => p.name).map(p => `- ${p.name}: R$ ${p.price} | Desc: ${p.desc}`).join('\n')
        : "";

      const safetyPart = blockedSubjects.length > 0
        ? `\n\n### TÓPICOS PROIBIDOS (DIRETRIZ DE SEGURANÇA) ###\nNão fale, não opine e mude de assunto educadamente se o cliente mencionar: ${blockedSubjects.join(', ')}.`
        : "";

      const masterPrompt = `
### SOBRE A EMPRESA E SUA HISTÓRIA ###
${companyHistory || 'Não informado.'}

### HORÁRIOS DE ATENDIMENTO ###
${openingHours || 'Sempre disponível.'}

### INFORMAÇÕES DE LOGÍSTICA (ENTREGA/ENVIO) ###
${deliveryCosts || 'Consulte o atendente para valores de frete.'}

### MÉTODOS DE PAGAMENTO E CHECKOUT ###
${paymentMethods || 'Pergunte como o cliente prefere finalizar o pedido.'}
${productsPart}
${safetyPart}

### PERSONALIDADE E OUTRAS INSTRUÇÕES ###
${prompt}
      `.trim();

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          agent_id: agentId,
          bot_id: editingAgentId, // Essential for Firestore update
          bot_name: botName,
          area,
          prompt: masterPrompt,
          prompt_user_part: prompt, // Save raw instructions for editing
          first_message: firstMessage,
          language,
          voice_id: voiceId,
          entities: entities.filter((e: any) => e.name && e.description),
          // Save Superpowers Raw for Editing
          company_history: companyHistory,
          products_catalog: productsCatalog,
          payment_methods: paymentMethods,
          delivery_costs: deliveryCosts,
          opening_hours: openingHours,
          blocked_subjects: blockedSubjects,
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
            { id: 'agents', label: 'Meus Agentes', icon: 'M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z' },
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
              Sistema Online
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {activeTab === 'dash' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* 6 Grid Metrics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Conversas Totais</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{metrics?.total_conversations || 0}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase">Interações processadas</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Conversão</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{metrics?.conversion_rate || 0}%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3">
                    <div className="bg-[#3BC671] h-full rounded-full transition-all duration-1000" style={{ width: `${metrics?.conversion_rate || 0}%` }}></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Leads Capturados</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{metrics?.active_leads || 0}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase">Com dados de contato</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Duração Média</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{metrics?.avg_duration || '0s'}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase">Tempo de permanência</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Principais Regiões</p>
                  </div>
                  <div className="space-y-2">
                    {metrics?.top_regions?.length > 0 ? metrics.top_regions.slice(0, 2).map((r: any) => (
                      <div key={r.name} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-bold text-slate-700">{r.name}</span>
                        <span className="text-[10px] font-black text-slate-400">{r.count}</span>
                      </div>
                    )) : <p className="text-xs font-bold text-slate-400">Sem dados geográficos</p>}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Agentes Ativos</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{metrics?.total_agents || 0}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase">Unidades em produção</p>
                </div>
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motor de IA</p>
                      <h4 className="font-bold text-slate-900">Processamento Neural</h4>
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
                        <button onClick={() => { setAgentId(agent.agent_id); setBotName(agent.bot_name); setShowTest(true); setChatMessages([]); }} className="p-2 text-slate-400 hover:text-[#3BC671] hover:bg-green-50 rounded-lg transition-all">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </button>
                        <button onClick={() => handleDeleteAgent(agent.id, agent.agent_id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{agent.bot_name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 border-b border-slate-100 pb-4">{agent.area}</p>
                    <div className="h-20 overflow-hidden relative">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-3">"{agent.prompt}"</p>
                      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>

                    <div className="flex-1 mt-2">
                      <p className="text-xs text-slate-500 line-clamp-2">{agent.prompt || "Sem descrição disponível."}</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${agent.agent_id ? "bg-[#3BC671] animate-pulse" : "bg-slate-300"}`}></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{agent.agent_id ? "Ativo" : "Em Espera"}</span>
                      </div>
                      <button
                        onClick={() => openWADrawer(agent)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${agent.whatsapp_number || agent.whatsapp_config ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-[#3BC671] text-black hover:brightness-110 shadow-lg shadow-green-500/10"}`}
                      >
                        {agent.whatsapp_number || agent.whatsapp_config ? "Ajustar WhatsApp" : "Conectar WhatsApp"}
                      </button>

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
                    {[1, 2, 3, 4, 5].map(s => (
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
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 1: Identidade e História</h3>
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sobre a Empresa e sua História</label>
                      <textarea value={companyHistory} onChange={(e) => setCompanyHistory(e.target.value)} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all font-medium text-sm text-slate-700 leading-relaxed resize-none" placeholder="Conte um pouco sobre como a empresa começou, valores e missão..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mensagem de Saudação</label>
                      <input value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-semibold text-sm" placeholder="Primeira frase do robô..." />
                    </div>
                  </div>
                )}

                {drawerStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 2: Catálogo e Pagamentos</h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Produtos / Serviços</label>
                        <button onClick={() => setProductsCatalog([...productsCatalog, { name: '', price: '', desc: '' }])} className="text-[10px] font-bold text-[#3BC671] hover:underline">+ ADICIONAR ITEM</button>
                      </div>
                      <div className="space-y-3">
                        {productsCatalog.map((p, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 relative group">
                            <button onClick={() => setProductsCatalog(productsCatalog.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                              <input value={p.name} onChange={e => {
                                const newP = [...productsCatalog];
                                newP[idx].name = e.target.value;
                                setProductsCatalog(newP);
                              }} placeholder="Nome do Produto" className="bg-white border border-slate-100 rounded-lg p-3 text-xs outline-none focus:border-[#3BC671]" />
                              <input value={p.price} onChange={e => {
                                const newP = [...productsCatalog];
                                newP[idx].price = e.target.value;
                                setProductsCatalog(newP);
                              }} placeholder="Preço (Ex: 49.90)" className="bg-white border border-slate-100 rounded-lg p-3 text-xs outline-none focus:border-[#3BC671]" />
                            </div>
                            <input value={p.desc} onChange={e => {
                              const newP = [...productsCatalog];
                              newP[idx].desc = e.target.value;
                              setProductsCatalog(newP);
                            }} placeholder="Descrição curta do produto" className="w-full bg-white border border-slate-100 rounded-lg p-3 text-xs outline-none focus:border-[#3BC671]" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Links de Pagamento ou Chaves PIX</label>
                      <textarea value={paymentMethods} onChange={(e) => setPaymentMethods(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all font-medium text-sm text-slate-700 resize-none" placeholder="Cole aqui seus links de checkout ou chaves PIX..." />
                    </div>
                  </div>
                )}

                {drawerStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 3: Logística e Regras</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Custos de Entrega / Envio</label>
                        <textarea value={deliveryCosts} onChange={(e) => setDeliveryCosts(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all font-medium text-sm text-slate-700 resize-none" placeholder="Ex: R$ 10 para SP, grátis acima de R$ 200..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horários de Operação</label>
                        <textarea value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all font-medium text-sm text-slate-700 resize-none" placeholder="Ex: Seg a Sex das 08h às 18h..." />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Tópicos Banidos (Segurança)</label>
                      <div className="flex flex-wrap gap-2">
                        {['Política', 'Religião', 'Conteúdo Adulto', 'Concorrentes'].map(topic => (
                          <button
                            key={topic}
                            onClick={() => {
                              if (blockedSubjects.includes(topic)) setBlockedSubjects(blockedSubjects.filter(t => t !== topic));
                              else setBlockedSubjects([...blockedSubjects, topic]);
                            }}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${blockedSubjects.includes(topic) ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {drawerStep === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 4: Conhecimento Avançado</h3>

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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instruções e Personalidade Adicionais</label>
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#3BC671] transition-all font-medium text-sm text-slate-700 leading-relaxed resize-none" placeholder="Outras informações específicas que a IA deve saber..." />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base em Documento (PDF/TXT)</span>
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

                {drawerStep === 5 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-[#3BC671] pl-3">Passo 5: Captura de Insights</h3>
                      <button onClick={addEntity} className="text-[10px] font-bold text-[#3BC671] hover:underline">+ ADICIONAR CAMPO</button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sugestões de Coleta (Relatórios)</label>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_ENTITIES.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (!entities.find(e => e.name === s.name)) {
                                setEntities(prev => [...prev, { id: Date.now() + idx, ...s }]);
                              }
                            }}
                            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-600 hover:border-[#3BC671] hover:text-[#3BC671] transition-all"
                          >
                            + {s.name.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

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
              </div>


              <footer className="p-8 border-t border-slate-100 bg-white flex gap-3">
                {drawerStep > 1 && (
                  <button onClick={() => setDrawerStep(s => s - 1)} className="px-6 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                    Voltar
                  </button>
                )}
                {drawerStep < 5 ? (
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
          </div >
        )
      }

      {/* WhatsApp Connection Drawer */}
      {
        isWADrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in transition-all" onClick={() => setIsWADrawerOpen(false)} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-500">
              <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Conectar WhatsApp</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Agente: {waAgent?.bot_name}</p>
                </div>
                <button onClick={() => setIsWADrawerOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  {/* Connection Mode Selector */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setConnectionMode('automation')}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${connectionMode === 'automation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      Automação (Lite)
                    </button>
                    <button
                      onClick={() => setConnectionMode('native')}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${connectionMode === 'native' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      Meta API (Pro)
                    </button>
                  </div>

                  {connectionMode === 'automation' ? (
                    <>
                      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número do WhatsApp (Obrigatório)</label>
                          <input value={targetPhone} onChange={e => setTargetPhone(e.target.value)} type="text" placeholder="Ex: +5511999999999" className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-semibold text-sm placeholder:text-slate-300" />
                          <p className="text-[10px] text-slate-500 font-medium">Este número será registrado no Meta para automação.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-[#0F1115] text-white p-6 rounded-2xl space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#3BC671] rounded-xl flex items-center justify-center text-black font-black">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </div>
                            <div>
                              <p className="text-xs font-bold">Automation Cloud</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Powered by Mastra & Browser Use</p>
                            </div>
                          </div>

                          {!automationId && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <input value={autoEmail} onChange={e => setAutoEmail(e.target.value)} type="email" placeholder="Email de Acesso" className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-[#3BC671]" />
                                <input value={autoPassword} onChange={e => setAutoPassword(e.target.value)} type="password" placeholder="Sua Senha" className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-[#3BC671]" />
                              </div>
                              <button
                                onClick={() => {
                                  setAgentId(waAgent.agent_id);
                                  handleStartAutomation();
                                }}
                                disabled={isAutoConnecting}
                                className="w-full bg-[#3BC671] text-black font-bold text-xs py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
                              >
                                {isAutoConnecting ? 'INICIALIZANDO CLOUD...' : 'INICIAR REGISTRO NO META'}
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

                          {automationId && automationData?.step === 'success' && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                              <p className="text-[#3BC671] text-xs font-bold uppercase tracking-widest">WhatsApp Conectado!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-blue-900 uppercase tracking-tight">Modo Nativo (Coexistência)</p>
                          <p className="text-[10px] text-blue-700 font-medium leading-relaxed">Use o mesmo número no seu celular e na IA. Configure o Webhook abaixo no seu Meta Developer App.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Access Token</label>
                          <input value={metaAccessToken} onChange={e => setMetaAccessToken(e.target.value)} type="password" placeholder="EAAB..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-mono text-xs" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number ID</label>
                            <input value={metaPhoneNumberId} onChange={e => setMetaPhoneNumberId(e.target.value)} type="text" placeholder="123456789..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-mono text-xs" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WABA ID</label>
                            <input value={metaWabaId} onChange={e => setMetaWabaId(e.target.value)} type="text" placeholder="987654321..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#3BC671] transition-all font-mono text-xs" />
                          </div>
                        </div>

                        <div className="p-4 bg-slate-900 rounded-2xl space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL do Webhook (Copie para o Meta)</label>
                          <div className="flex gap-2">
                            <input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/whatsapp` : ''} className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] text-white font-mono outline-none" />
                            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/v1/webhooks/whatsapp`)} className="bg-white/10 hover:bg-white/20 px-3 rounded-lg text-white transition-all text-[10px] font-bold">COPIAR</button>
                          </div>
                        </div>

                        <button
                          onClick={handleSaveNativeConfig}
                          disabled={isSavingNative || !metaAccessToken || !metaPhoneNumberId}
                          className="w-full bg-[#3BC671] text-black font-bold text-xs py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-green-500/10"
                        >
                          {isSavingNative ? 'SALVANDO CONFIGURAÇÃO...' : 'SALVAR CONFIGURAÇÃO NATIVA'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
              <footer className="p-8 border-t border-slate-100 bg-white">
                <button onClick={() => setIsWADrawerOpen(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm">Fechar</button>
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
              <div className="h-[500px] w-full bg-[#E5DDD5] relative flex flex-col">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-10">
                      <p className="bg-[#FFF5C4] inline-block px-3 py-1 rounded-lg text-xs text-slate-500 shadow-sm border border-[#F0Ead6]">
                        🔒 Mensagens protegidas com criptografia de ponta-a-ponta.
                      </p>
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 shadow-sm relative text-sm ${msg.sender === 'user' ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                        <p>{msg.text}</p>
                        <span className="text-[10px] text-slate-400 float-right ml-2 mt-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  {isSendingMessage && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg p-3 shadow-sm rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-[#F0F2F5] flex items-center gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && chatInput.trim() && !isSendingMessage) {
                        const text = chatInput;
                        setChatInput('');
                        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        setChatMessages(prev => [...prev, { sender: 'user', text, timestamp: now }]);

                        setIsSendingMessage(true);
                        try {
                          const res = await fetch(`${API_PREFIX}/chat/send`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              agentId,
                              message: text,
                              history: chatMessages.slice(-10).map(m => ({ sender: m.sender, text: m.text }))
                            })
                          });
                          const data = await res.json();
                          const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          setChatMessages(prev => [...prev, { sender: 'bot', text: data.text || "Erro ao processar.", timestamp: replyTime }]);
                        } catch (err) {
                          setChatMessages(prev => [...prev, { sender: 'bot', text: "Erro de conexão.", timestamp: now }]);
                        } finally {
                          setIsSendingMessage(false);
                        }
                      }
                    }}
                    type="text"
                    placeholder="Digite uma mensagem"
                    className="flex-1 bg-white rounded-lg px-4 py-2 text-sm outline-none border border-transparent focus:border-[#3BC671]"
                  />
                  <button
                    onClick={async () => {
                      if (chatInput.trim() && !isSendingMessage) {
                        const text = chatInput;
                        setChatInput('');
                        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        setChatMessages(prev => [...prev, { sender: 'user', text, timestamp: now }]);

                        setIsSendingMessage(true);
                        try {
                          const res = await fetch(`${API_PREFIX}/chat/send`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              agentId,
                              message: text,
                              history: chatMessages.slice(-10).map(m => ({ sender: m.sender, text: m.text }))
                            })
                          });
                          const data = await res.json();
                          const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          setChatMessages(prev => [...prev, { sender: 'bot', text: data.text || "Erro ao processar.", timestamp: replyTime }]);
                        } catch (err) {
                          setChatMessages(prev => [...prev, { sender: 'bot', text: "Erro de conexão.", timestamp: now }]);
                        } finally {
                          setIsSendingMessage(false);
                        }
                      }
                    }}
                    className="p-2 bg-[#3BC671] text-white rounded-full hover:brightness-110 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
