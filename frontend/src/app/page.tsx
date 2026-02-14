"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_PREFIX = "/api/v1";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');

  const [activeTab, setActiveTab] = useState<'dash' | 'agents' | 'settings'>('dash');
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'billing'>('profile');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Sensei States
  const [senseiInput, setSenseiInput] = useState('');
  const [isSenseiLoading, setIsSenseiLoading] = useState(false);
  const [senseiMessages, setSenseiMessages] = useState<Array<{ sender: 'sensei' | 'user', text: string }>>([
    { sender: 'sensei', text: 'Olá! Eu sou o Sensei. Estou aqui para elevar o nível do seu negócio. O que vamos criar hoje?' }
  ]);

  const [activeAgentMenu, setActiveAgentMenu] = useState<string | null>(null);

  useEffect(() => {
    // Carregar SDK da Meta (Facebook)
    if (typeof window !== 'undefined') {
      (window as any).fbAsyncInit = function () {
        (window as any).FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
          cookie: true,
          xfbml: true,
          version: 'v21.0'
        });
      };

      (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement; js.id = id;
        js.src = "https://connect.facebook.net/pt_BR/sdk.js";
        if (fjs && fjs.parentNode) fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }

    const savedUser = localStorage.getItem('eleven_user');
    const savedEmail = localStorage.getItem('eleven_email');
    if (savedUser) {
      setUserId(savedUser);
      if (savedEmail) setEmail(savedEmail);
      setIsLoggedIn(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  const launchWhatsAppSignup = () => {
    if (!(window as any).FB) {
      alert("O SDK da Meta ainda está carregando. Por favor, aguarde um momento.");
      return;
    }

    (window as any).FB.login((response: any) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        console.log("Logged in successfully. Access Token:", accessToken);
        // Aqui chamaremos nosso backend para processar o signup e capturar os IDs
        handleMetaSignupCallback(accessToken);
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
      extras: {
        feature: 'whatsapp_embedded_signup',
        setup: {
          // Placeholder para configurações futuras de flow
        }
      }
    });
  };

  const handleMetaSignupCallback = async (token: string) => {
    try {
      setIsSavingNative(true);
      // Endpoint que implementaremos para trocar o token e buscar Phone ID / WABA ID
      const res = await fetch(`${API_PREFIX}/whatsapp/embedded-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          access_token: token,
          agent_id: waAgent?.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Conectado com sucesso! Número: ${data.phone_number}`);
        setIsWADrawerOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert("Erro no processamento da Meta: " + (err.message || "Tente novamente"));
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Erro de conexão ao processar login.");
    } finally {
      setIsSavingNative(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('eleven_user');
    localStorage.removeItem('eleven_email');
    setIsLoggedIn(false);
    router.push('/login');
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
        setActiveAgentMenu(null);
        alert("Agente removido com sucesso!");
      } else {
        alert("Erro ao remover agente.");
      }
    } catch (err) {
      alert("Erro na conexão ao deletar.");
    }
  };

  const handleToggleArchive = async (agent: any) => {
    const isArchived = agent.status === 'archived';
    const newStatus = isArchived ? 'active' : 'archived';

    try {
      const res = await fetch(`${API_PREFIX}/agent/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          ...agent,
          status: newStatus
        })
      });

      if (res.ok) {
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
        setActiveAgentMenu(null);
        alert(isArchived ? "Unidade reativada!" : "Unidade arquivada (inoperante).");
      } else {
        alert("Erro ao atualizar status.");
      }
    } catch (err) {
      alert("Erro de conexão.");
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

  const handleSenseiConsult = async () => {
    if (!senseiInput.trim() || isSenseiLoading) return;

    const userMessage = senseiInput;
    setSenseiInput('');
    setSenseiMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsSenseiLoading(true);

    try {
      const res = await fetch(`${API_PREFIX}/sensei/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: senseiMessages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await res.json();
      if (data.text) {
        setSenseiMessages(prev => [...prev, { sender: 'sensei', text: data.text }]);
      }
    } catch (err) {
      setSenseiMessages(prev => [...prev, { sender: 'sensei', text: "O Sensei teve um lapso na conexão. Tente novamente, gafanhoto." }]);
    } finally {
      setIsSenseiLoading(false);
    }
  };

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
    if (!metaPhoneNumberId) return alert("Por favor, preencha o Phone Number ID.");
    setIsSavingNative(true);
    try {
      const res = await fetch(`${API_PREFIX}/agent/whatsapp/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId },
        body: JSON.stringify({
          agent_id: waAgent.agent_id,
          whatsapp_config: {
            phone_number_id: metaPhoneNumberId,
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
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="w-16 h-16 bg-[#3BC671] rounded-2xl flex items-center justify-center text-black font-black text-2xl animate-bounce shadow-2xl shadow-green-500/20 italic">11</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0F1115] font-sans antialiased flex flex-col lg:flex-row">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-[#0F1115] h-full flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#3BC671] rounded-lg flex items-center justify-center text-black font-black text-sm">11</div>
                <span className="font-bold tracking-tight text-white text-lg">Eleven Chat</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {[
                { id: 'dash', label: 'Painel Geral', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
                { id: 'agents', label: 'Meus Agentes', icon: 'M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id ? 'bg-[#3BC671] text-black shadow-lg shadow-green-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d={item.icon} /></svg>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800/50 space-y-2">
              <button
                onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'settings' ? 'bg-[#3BC671]/10 text-[#3BC671]' : 'text-slate-400 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                Configurações
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar Navigation - FIXED */}
      <aside className="hidden lg:flex w-64 bg-[#0F1115] text-white flex-col fixed left-0 top-0 h-screen z-50 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 mb-4">
          <div className="w-8 h-8 bg-[#3BC671] rounded-lg flex items-center justify-center text-black font-black text-sm">11</div>
          <span className="font-bold tracking-tight text-lg">Eleven Chat</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dash', label: 'Painel Geral', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
            { id: 'agents', label: 'Meus Agentes', icon: 'M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z' },
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

        <div className="px-4 py-4 space-y-1 border-t border-slate-800/50">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'bg-[#3BC671]/10 text-[#3BC671]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Configurações
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-colors">
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area - SCROLLABLE */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-[#F8F9FB]">
        <header className="h-20 flex items-center justify-between px-6 lg:px-12 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col">
              <p className="text-[9px] font-black text-[#3BC671] uppercase tracking-[0.3em] mb-0.5">Eleven Chat Platform</p>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {activeTab === 'dash' ? 'Performance Global' : activeTab === 'agents' ? 'IA Conversacional' : 'Ajustes de Sistema'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3BC671]"></span>
              </span>
              Infraestrutura Ok
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-12 max-w-[1400px] mx-auto w-full">
          {activeTab === 'dash' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Dashboard Hero Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Volume de Conversas */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden relative group hover:border-[#3BC671]/30 transition-all">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3BC671] animate-pulse"></span>
                    Volume de Conversas
                  </p>
                  <h3 className="text-6xl font-black text-slate-900 leading-none tracking-tight">{metrics?.total_conversations || 0}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-4 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-50 text-[#3BC671] rounded-md text-[10px]">↑ 12%</span>
                    <span className="opacity-60">Crescimento Semanal</span>
                  </p>
                </div>

                {/* 2. Top Produtos Semanal (Bar Chart) */}
                <div className="bg-[#0F1115] p-8 rounded-3xl shadow-xl lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Top Produtos Interresse (Semanal)</p>
                    <div className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-slate-400">7 DIAS</div>
                  </div>
                  <div className="space-y-4">
                    {metrics?.weekly_products?.length > 0 ? metrics.weekly_products.map((p: any, idx: number) => (
                      <div key={p.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-white uppercase tracking-wider">{p.name}</span>
                          <span className="text-[#3BC671]">{p.count} solicitações</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#3BC671] to-[#2da15a] rounded-full transition-all duration-1000"
                            style={{ width: `${(p.count / metrics.weekly_products[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    )) : <p className="text-xs text-slate-600 font-bold py-4">Aguardando dados de interesse...</p>}
                  </div>
                </div>

                {/* 3. Top Regiões Semanal (Bar Chart) */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Distribuição por Região</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {metrics?.weekly_regions?.length > 0 ? metrics.weekly_regions.map((r: any) => (
                        <div key={r.name} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#3BC671]"></div>
                          <span className="text-xs font-bold text-slate-700 flex-1">{r.name}</span>
                          <span className="text-xs font-black text-slate-900">{r.count}</span>
                        </div>
                      )) : <p className="text-xs text-slate-400">Sem dados geográficos ainda.</p>}
                    </div>
                    <div className="flex items-end justify-center">
                      <div className="flex gap-2 items-end h-24">
                        {[40, 70, 45, 90, 60].map((h, i) => (
                          <div key={i} className="w-3 bg-slate-100 rounded-t-lg relative">
                            <div className="absolute bottom-0 w-full bg-[#3BC671] rounded-t-lg transition-all duration-1000" style={{ height: `${h}%` }}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Taxa de Conversão */}
                <div className="bg-[#0F1115] p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#3BC671] blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Taxa de Conversão</p>
                  <div>
                    <h3 className="text-6xl font-black text-[#3BC671] leading-none tracking-tight">{metrics?.conversion_rate || 0}%</h3>
                    <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#3BC671] transition-all duration-1000" style={{ width: `${metrics?.conversion_rate || 0}%` }}></div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-4">Eficiência de Qualificação</p>
                  </div>
                </div>

                {/* 5. Leads Capturados */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Base de Leads</p>
                  <h3 className="text-4xl font-black text-slate-900">{metrics?.active_leads || 0}</h3>
                  <div className="mt-6 flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">U{i}</div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#3BC671] flex items-center justify-center text-[10px] font-bold text-black">+</div>
                  </div>
                </div>

                {/* 6. Status do Sistema */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Operacional</p>
                    <h3 className="text-xl font-black text-slate-900">SISTEMA ATIVO</h3>
                    <p className="text-[10px] font-bold text-[#3BC671] uppercase mt-2">{metrics?.total_agents || 0} Agentes Rodando</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center animate-pulse">
                    <div className="w-3 h-3 bg-[#3BC671] rounded-full"></div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex gap-8 border-b border-slate-200">
                <button
                  onClick={() => setSettingsSubTab('profile')}
                  className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${settingsSubTab === 'profile' ? 'border-[#3BC671] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Meus Dados
                </button>
                <button
                  onClick={() => setSettingsSubTab('billing')}
                  className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${settingsSubTab === 'billing' ? 'border-[#3BC671] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Assinatura
                </button>
              </div>

              {settingsSubTab === 'profile' && (
                <div className="max-w-2xl bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label>
                      <input type="text" defaultValue="Admin Eleven" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#3BC671]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail</label>
                      <input type="email" value={email} readOnly className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-500 outline-none cursor-not-allowed" />
                    </div>
                  </div>
                  <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">Salvar Alterações</button>
                </div>
              )}

              {settingsSubTab === 'billing' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#3BC671] to-[#2da15a] p-8 rounded-3xl text-black shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Plano Atual</p>
                      <h3 className="text-3xl font-black mt-2">PREMIUM UNLIMITED</h3>
                      <p className="text-sm font-bold mt-4 opacity-80">Renovação Mensal Automática</p>
                      <button className="mt-8 bg-black text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-slate-900 transition-all">GERENCIAR FATURAMENTO</button>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                      <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.57-.34-2.82-1.39-2.94-2.89h1.96c.11.75.7 1.29 1.98 1.29 1.3 0 1.87-.66 1.87-1.4 0-2.12-4.75-1.54-4.75-4.8 0-1.45 1.01-2.58 2.89-2.91V6h2.82v1.94c1.23.23 2.19 1.01 2.39 2.16h-1.93c-.15-.49-.49-.93-1.46-.93-.85 0-1.87.39-1.87 1.34 0 1.94 4.75 1.33 4.75 4.74 0 1.45-1.04 2.53-2.89 2.84z" /></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === 'agents' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">


              {/* Sensei Consultation Box - HIDDEN FOR SECOND RELEASE
              <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
                ... (código preservado para release 2)
              </div>
              */}

              {/* Agents Grid Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-[#3BC671] rounded-full"></div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Suas Unidades</h3>
                  </div>
                  <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] ml-4">Monitoramento de Ativos de IA em Tempo Real</p>
                </div>

                <button
                  onClick={openNewAgentDrawer}
                  className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#3BC671] hover:text-black transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 group h-fit"
                >
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Novo Agente de Elite
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent, idx) => {
                  const colors = ['#3BC671', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#06b6d4'];
                  const color = colors[idx % colors.length];
                  const isArchived = agent.status === 'archived';

                  return (
                    <div key={agent.id} className={`bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all flex flex-col items-center text-center group relative overflow-hidden w-full ${isArchived ? 'grayscale' : ''}`}>
                      {isArchived && (
                        <div className="absolute top-4 left-4 z-10 bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Inoperante</div>
                      )}

                      {/* Colorful Logo 11 */}
                      <div
                        className="w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-3xl italic mb-6 shadow-lg transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${color}15`, color: color, border: `2px solid ${color}30` }}
                      >
                        11
                      </div>

                      <div className="space-y-2 mb-6 w-full">
                        <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight px-2">{agent.bot_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{agent.area}</p>
                      </div>

                      <div className="w-full pt-6 border-t border-slate-50 flex flex-col gap-3">
                        <div className="flex gap-2 w-full relative">
                          <button
                            onClick={() => { setAgentId(agent.agent_id); setBotName(agent.bot_name); setShowTest(true); setChatMessages([]); }}
                            disabled={isArchived}
                            className="bg-slate-900 text-white flex-1 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                          >
                            Testar
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActiveAgentMenu(activeAgentMenu === agent.id ? null : agent.id)}
                              className="bg-slate-100 text-slate-500 p-3.5 rounded-2xl hover:bg-slate-200 transition-all"
                            >
                              <svg className={`w-4 h-4 transition-transform duration-500 ${activeAgentMenu === agent.id ? 'rotate-90' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>

                            {activeAgentMenu === agent.id && (
                              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button onClick={() => { openEditDrawer(agent); setActiveAgentMenu(null); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  Editar Configs
                                </button>
                                <button onClick={() => handleToggleArchive(agent)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                                  <svg className={`w-3.5 h-3.5 ${isArchived ? 'text-green-500' : 'text-orange-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                  {isArchived ? 'Reativar Unidade' : 'Arquivar Unidade'}
                                </button>
                                <div className="h-px bg-slate-50 my-1" />
                                <button onClick={() => handleDeleteAgent(agent.id, agent.agent_id)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  Excluir Definitivo
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => openWADrawer(agent)}
                          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${agent.whatsapp_config?.phone_number_id ? 'bg-[#3BC671]/10 text-[#3BC671] border border-[#3BC671]/20' : 'bg-[#3BC671] text-black hover:brightness-110 shadow-lg shadow-green-500/10'}`}
                        >
                          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          <span className="truncate">{agent.whatsapp_config?.phone_number_id ? 'WhatsApp Ativo' : 'Conectar WhatsApp'}</span>
                        </button>
                      </div>

                      {/* Status Indicator */}
                      <div className="absolute top-6 right-6">
                        <div className={`w-2 h-2 rounded-full ${agent.agent_id ? "bg-[#3BC671]" : "bg-slate-300"} shadow-lg shadow-green-500/20`}></div>
                      </div>
                    </div>
                  );
                })}

                {agents.length === 0 && (
                  <div className="col-span-full py-32 bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3BC671] to-transparent opacity-20"></div>
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center font-black text-4xl italic text-slate-200 mb-8 border border-slate-100">11</div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Primeira Unidade Pronta?</h4>
                    <p className="max-w-md text-sm text-slate-400 font-medium leading-relaxed mb-10">
                      Você ainda não possui agentes ativos. Inicie sua operação criando um agente especializado para seu nicho de mercado.
                    </p>
                    <button
                      onClick={openNewAgentDrawer}
                      className="bg-[#3BC671] text-black font-black text-[11px] uppercase tracking-[0.2em] px-12 py-5 rounded-full hover:brightness-110 shadow-xl shadow-green-500/20 transition-all active:scale-95"
                    >
                      Ativar Primeiro Agente
                    </button>
                  </div>
                )}
              </div>
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

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Idioma de Operação</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'en', label: 'Inglês', icon: '🇺🇸' },
                          { id: 'pt-br', label: 'PT Brasil', icon: '🇧🇷' },
                          { id: 'pt', label: 'PT Portugal', icon: '🇵🇹' },
                        ].map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id)}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${language === lang.id ? 'border-[#3BC671] bg-[#3BC671]/5 text-slate-900' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                          >
                            <span className="text-xl">{lang.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{lang.label}</span>
                          </button>
                        ))}
                      </div>
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

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                  {/* Hero Section */}
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-[#3BC671]/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-[#3BC671]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Conecte sua Inteligência ao WhatsApp</h3>
                    <p className="text-sm text-slate-500 font-medium px-4">Integração nativa via Meta Cloud API. Seus clientes atendidos 24/7 sem interrupções.</p>
                  </div>

                  {/* Connect Steps */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">1</div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">Login com Facebook</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Conecte sua conta empresarial e selecione o número de telefone.</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">2</div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">Permissões</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Dê permissão para que o seu agente possa ler e enviar mensagens.</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#3BC671] text-black flex items-center justify-center font-black text-xs shrink-0">3</div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">Pronto para rodar!</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Sua IA assume o atendimento automaticamente em tempo real.</p>
                      </div>
                    </div>
                  </div>

                  {/* Main Action Component */}
                  <div className="pt-4 space-y-4">
                    <button
                      onClick={launchWhatsAppSignup}
                      disabled={isSavingNative}
                      className="w-full bg-[#1877F2] text-white font-black text-sm py-5 rounded-[2rem] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
                    >
                      {isSavingNative ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.248h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                          Conectar com Facebook
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">
                      Conexão segura via Meta Business Partners
                    </p>
                  </div>

                  {/* Benefits Banner */}
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#3BC671] blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3BC671] animate-pulse"></span>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tecnologia Multi-Agent</p>
                      </div>
                      <h4 className="text-white font-black text-lg leading-tight uppercase italic">Coexistência Perfeita</h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        Continue usando seu WhatsApp Web ou Celular normalmente. A IA trabalha em conjunto, sem desconectar você.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              <footer className="p-8 border-t border-slate-100 bg-white/80 backdrop-blur-md shrink-0">
                <button onClick={() => setIsWADrawerOpen(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Fechar Ajustes</button>
              </footer>
            </div>
          </div>
        )
      }

      {/* Test Modal - Ultra Modern Glass */}
      {
        showTest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setShowTest(false)}>
            <div
              className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-[#3BC671] rounded-2xl flex items-center justify-center font-black text-xl italic">11</div>
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Laboratório de Testes</h3>
                    <p className="text-[10px] font-black text-[#3BC671] uppercase tracking-[0.2em] animate-pulse">Agente: {botName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTest(false)}
                  className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC] space-y-6 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="w-16 h-16 bg-slate-200 rounded-3xl flex items-center justify-center font-black text-2xl italic text-slate-400">11</div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aguardando entrada para simulação</p>
                  </div>
                ) : chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] space-y-1`}>
                      <div className={`px-6 py-4 rounded-3xl text-sm font-medium shadow-sm leading-relaxed ${m.sender === 'user' ? 'bg-[#3BC671] text-black rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                        {m.text}
                      </div>
                      <p className={`text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>{m.timestamp}</p>
                    </div>
                  </div>
                ))}
                {isSendingMessage && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="max-w-[85%] space-y-1">
                      <div className="px-6 py-4 rounded-3xl text-sm font-medium shadow-sm leading-relaxed bg-white border border-slate-200 text-slate-700 rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 sm:p-8 bg-white border-t border-slate-50 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 border border-slate-200 rounded-full sm:rounded-[1.5rem] p-2 pr-2 sm:pr-3 focus-within:border-[#3BC671] transition-all">
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
                    placeholder="Envie um comando para teste de fogo..."
                    className="flex-1 bg-transparent px-4 py-2 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
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
                    disabled={isSendingMessage}
                    className="bg-[#3BC671] text-black w-10 h-10 rounded-xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-green-500/10 disabled:opacity-50"
                  >
                    {isSendingMessage ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
