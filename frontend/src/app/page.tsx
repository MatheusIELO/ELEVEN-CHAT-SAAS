"use client";

import React, { useState, useEffect } from 'react';

const API_BASE_URL = "https://eleven-chat-saas-production.up.railway.app";

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');

  const [activeTab, setActiveTab] = useState<'dash' | 'setup'>('dash');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total_conversations: 0, total_leads: 0, conversion_rate: '0%' });
  const [interactions, setInteractions] = useState<any[]>([]);

  // Setup State
  const [agentId, setAgentId] = useState('');
  const [area, setArea] = useState('');
  const [botName, setBotName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [entities, setEntities] = useState([{ id: 1, name: 'customer_name', description: 'Nome do cliente' }]);

  // Test State
  const [showTest, setShowTest] = useState(false);

  const addEntity = () => {
    setEntities([...entities, { id: Date.now(), name: '', description: '' }]);
  };

  const updateEntity = (id: number, field: 'name' | 'description', value: string) => {
    setEntities(entities.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

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
      const statsRes = await fetch(`${API_BASE_URL}/api/v1/stats`, { headers });
      const statsData = await statsRes.json();
      setStats(statsData);

      const interRes = await fetch(`${API_BASE_URL}/api/v1/interactions`, { headers });
      const interData = await interRes.json();
      setInteractions(interData);
    } catch (error: any) {
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

  const handleSaveAgent = async () => {
    if (!agentId) return alert("Insira o ID do Agente.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agent/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          agent_id: agentId,
          area,
          bot_name: botName,
          prompt,
          entities: entities.map(({ name, description }) => ({ name, description }))
        })
      });
      if (res.ok) {
        alert("Robô configurado na sua conta!");
        setActiveTab('dash');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.detail || "Erro ao salvar"}`);
      }
    } catch (e) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-10 animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl font-bold gradient-text mb-2 text-center">Eleven Chat</h1>
          <p className="text-gray-400 text-center mb-8">O cérebro de vendas do seu WhatsApp</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Seu E-mail</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 outline-none focus:border-indigo-500 transition" placeholder="nome@empresa.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 outline-none focus:border-indigo-500 transition" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-500 transition shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              Entrar na Plataforma
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-6 italic">Acesso exclusivo para parceiros autorizados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">11</div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Eleven Chat</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">UID: {userId}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2 bg-[#101014] p-1 rounded-xl border border-gray-800">
            <button onClick={() => setActiveTab('dash')} className={`px-6 py-2 rounded-lg transition ${activeTab === 'dash' ? 'bg-[#1e1e24] text-white' : 'text-gray-500 hover:text-white'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('setup')} className={`px-6 py-2 rounded-lg transition ${activeTab === 'setup' ? 'bg-[#1e1e24] text-white' : 'text-gray-500 hover:text-white'}`}>Setup</button>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm font-bold transition">Sair</button>
        </div>
      </div>

      {activeTab === 'dash' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-6 border-l-4 border-indigo-500">
              <h3 className="text-gray-400 text-xs uppercase font-bold mb-1">Conversas</h3>
              <p className="text-4xl font-black">{stats.total_conversations}</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-green-500">
              <h3 className="text-gray-400 text-xs uppercase font-bold mb-1">Leads Detectados</h3>
              <p className="text-4xl font-black">{stats.total_leads}</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-purple-500">
              <h3 className="text-gray-400 text-xs uppercase font-bold mb-1">Taxa de Captura</h3>
              <p className="text-4xl font-black">{stats.conversion_rate}</p>
            </div>
          </div>

          <div className="glass-card p-8 animate-in fade-in duration-700">
            <h2 className="text-xl font-bold mb-8">Log de Inteligência</h2>
            <div className="space-y-4">
              {interactions.map((i: any) => (
                <div key={i.conversation_id} className="bg-[#101014] border border-gray-900 rounded-2xl p-6 hover:border-gray-700 transition group">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-relaxed flex-1 pr-8">{i.summary}</p>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${i.sentiment === 'positive' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                      {i.sentiment || 'Neutro'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-900">
                    {Object.entries(i.extracted_data || {}).map(([key, val]: [string, any]) => (
                      <div key={key} className="bg-indigo-500/5 border border-indigo-500/10 px-3 py-1.5 rounded-lg">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mr-2">{key}:</span>
                        <span className="text-[10px] text-indigo-400 font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {interactions.length === 0 && <div className="text-center py-20 text-gray-600 font-medium italic">Aguardando as primeiras interações do seu robô...</div>}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
          <div className="glass-card p-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-bold">Configuração do Robô</h2>
                <p className="text-gray-400 text-sm mt-1">Personalize o comportamento e a inteligência da IA.</p>
              </div>
              <button
                onClick={() => setShowTest(true)}
                className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)] transition"
              >
                ⚡ Testar Robô Agora
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Agent ID (ElevenLabs)</label>
                <input value={agentId} onChange={(e) => setAgentId(e.target.value)} type="text" className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 outline-none focus:border-indigo-500" placeholder="Cole o ID do seu agente TwelveLabs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Área (ex: Imobiliária)</label>
                  <input value={area} onChange={(e) => setArea(e.target.value)} type="text" className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 outline-none" placeholder="Ex: Venda de Imóveis" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome do Bot</label>
                  <input value={botName} onChange={(e) => setBotName(e.target.value)} type="text" className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 outline-none" placeholder="Ex: Assistente Bruma" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Como ele deve falar?</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 outline-none" placeholder="Como o robô deve falar?" />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase">Campos para Extrair (Nome, Email, etc.)</label>
                  <button onClick={addEntity} className="text-xs text-indigo-400 underline font-bold">+ Adicionar</button>
                </div>
                {entities.map((e: any) => (
                  <div key={e.id} className="flex gap-2">
                    <input value={e.name} onChange={(ev: any) => updateEntity(e.id, 'name', ev.target.value)} type="text" className="flex-1 bg-black/50 border border-gray-800 rounded-lg p-3 text-sm outline-none" placeholder="Nome do campo" />
                    <input value={e.description} onChange={(ev: any) => updateEntity(e.id, 'description', ev.target.value)} type="text" className="flex-[2] bg-black/50 border border-gray-800 rounded-lg p-3 text-sm outline-none" placeholder="O que capturar?" />
                  </div>
                ))}
              </div>

              <button disabled={loading} onClick={handleSaveAgent} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-lg hover:bg-indigo-500 transition shadow-lg">
                {loading ? "Processando..." : "Salvar & Sincronizar"}
              </button>
            </div>
          </div>

          <div className="glass-card p-10 border-dashed border-gray-800 opacity-60">
            <h2 className="text-xl font-bold mb-2">Conectar ao WhatsApp</h2>
            <p className="text-gray-400 text-sm mb-6">Integre este robô diretamente ao seu número oficial via API Meta.</p>
            <button className="bg-gray-800 py-3 px-8 rounded-xl font-bold text-gray-400 cursor-not-allowed">
              Em breve: Meta Embedded Signup
            </button>
          </div>
        </div>
      )}

      {/* Modal de Teste */}
      {showTest && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#101014] border border-gray-800 w-full max-w-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#15151a]">
              <h3 className="font-bold">Testando Inteligência: {botName}</h3>
              <button onClick={() => setShowTest(false)} className="text-gray-500 hover:text-white font-bold">FECHAR</button>
            </div>
            <div className="h-[500px] w-full bg-black flex flex-col items-center justify-center p-12 text-center">
              {agentId ? (
                <>
                  <p className="text-indigo-400 mb-4 animate-pulse uppercase text-xs font-bold">Conectando ao núcleo da ElevenLabs...</p>
                  <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>
                  <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
                  <p className="text-gray-500 text-xs mt-8">Clique no microfone para começar a falar com sua IA.</p>
                </>
              ) : (
                <p className="text-red-400">Configure um Agent ID primeiro para testar!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
