"use client";

import React, { useState, useEffect } from 'react';

const API_BASE_URL = "https://eleven-chat-saas-production.up.railway.app";

export default function DashboardPage() {
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

  const addEntity = () => {
    setEntities([...entities, { id: Date.now(), name: '', description: '' }]);
  };

  const updateEntity = (id: number, field: 'name' | 'description', value: string) => {
    setEntities(entities.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const fetchData = async () => {
    try {
      const statsRes = await fetch(`${API_BASE_URL}/api/v1/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const interRes = await fetch(`${API_BASE_URL}/api/v1/interactions`);
      const interData = await interRes.json();
      setInteractions(interData);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Reload every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSaveAgent = async () => {
    if (!agentId) return alert("Por favor, insira o ID do Agente da ElevenLabs.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agent/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          area,
          bot_name: botName,
          prompt,
          entities: entities.map(({ name, description }) => ({ name, description }))
        })
      });
      if (res.ok) {
        alert("Robô atualizado com sucesso na ElevenLabs!");
        setActiveTab('dash');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.detail || "Erro ao salvar"}`);
      }
    } catch (e) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Eleven Chat</h1>
          <p className="text-gray-400 mt-2">Revenue Intelligence AI Dashboard</p>
        </div>
        <div className="flex gap-2 bg-[#101014] p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('dash')}
            className={`px-6 py-2 rounded-lg transition ${activeTab === 'dash' ? 'bg-[#1e1e24] shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-6 py-2 rounded-lg transition ${activeTab === 'setup' ? 'bg-[#1e1e24] shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Setup do Robô
          </button>
        </div>
      </div>

      {activeTab === 'dash' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card p-6 border-l-4 border-indigo-500">
              <h3 className="text-gray-400 text-sm uppercase font-semibold">Conversas Totais</h3>
              <p className="text-3xl font-bold mt-1">{stats.total_conversations}</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-green-500">
              <h3 className="text-gray-400 text-sm uppercase font-semibold">Total de Leads</h3>
              <p className="text-3xl font-bold mt-1">{stats.total_leads}</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-purple-500">
              <h3 className="text-gray-400 text-sm uppercase font-semibold">Taxa de Conversão</h3>
              <p className="text-3xl font-bold mt-1">{stats.conversion_rate}</p>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-xl font-bold mb-8">Interações Reais do WhatsApp</h2>
            <div className="overflow-x-auto">
              {interactions.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Aguardando as primeiras conversas...</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="pb-4">Resumo da Conversa</th>
                      <th className="pb-4">Sentimento</th>
                      <th className="pb-4">Dados Coletados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interactions.map((i: any) => (
                      <tr key={i.conversation_id} className="border-b border-gray-900 hover:bg-white/5 transition">
                        <td className="py-4 pr-4">
                          <p className="text-sm line-clamp-2">{i.summary}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${i.sentiment === 'positive' ? 'bg-green-500/10 text-green-400' :
                            i.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' : 'bg-gray-800 text-gray-400'
                            }`}>
                            {i.sentiment || 'Neutro'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(i.extracted_data || {}).map(([key, val]: [string, any]) => (
                              <span key={key} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">
                                {key}: {val}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto glass-card p-10">
          <h2 className="text-2xl font-bold mb-2">Configuração do Robô</h2>
          <p className="text-gray-400 mb-8">Dê inteligência ao seu WhatsApp com agentes da ElevenLabs.</p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Agent ID (ElevenLabs)</label>
              <input value={agentId} onChange={(e) => setAgentId(e.target.value)} type="text" className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 outline-none focus:border-indigo-500" placeholder="Cole o ID que está na URL da ElevenLabs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Área de Atuação</label>
                <input value={area} onChange={(e) => setArea(e.target.value)} type="text" className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 outline-none" placeholder="Ex: Venda de Imóveis" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome do Bot</label>
                <input value={botName} onChange={(e) => setBotName(e.target.value)} type="text" className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 outline-none" placeholder="Ex: Assistente Bruma" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Personalidade / Instruções</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 outline-none" placeholder="Como o robô deve falar?" />
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase">Campos para Extrair (Nome, Email, etc.)</label>
                <button onClick={addEntity} className="text-xs text-indigo-400 underline font-bold">+ Adicionar</button>
              </div>
              {entities.map(e => (
                <div key={e.id} className="flex gap-2">
                  <input value={e.name} onChange={(ev) => updateEntity(e.id, 'name', ev.target.value)} type="text" className="flex-1 bg-black/50 border border-gray-800 rounded-lg p-3 text-sm outline-none" placeholder="Nome do campo" />
                  <input value={e.description} onChange={(ev) => updateEntity(e.id, 'description', ev.target.value)} type="text" className="flex-[2] bg-black/50 border border-gray-800 rounded-lg p-3 text-sm outline-none" placeholder="O que capturar?" />
                </div>
              ))}
            </div>

            <button
              disabled={loading}
              onClick={handleSaveAgent}
              className="w-full bg-indigo-600 py-4 rounded-xl font-bold mt-8 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? "Sincronizando..." : "Sincronizar com ElevenLabs"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
