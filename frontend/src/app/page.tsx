"use client";

import React, { useState } from 'react';

// Mock data for the dashboard
const STATS = [
  { label: 'Conversas Totais', value: '1,284', change: '+12.5%', icon: '💬' },
  { label: 'Novos Leads', value: '142', change: '+18.2%', icon: '👤' },
  { label: 'Objeções de Preço', value: '42', change: '-5.4%', icon: '💰' },
  { label: 'Taxa de Conversão', value: '24.8%', change: '+2.1%', icon: '🚀' },
];

const RECENT_INSIGHTS = [
  { id: 1, name: 'Marcos Oliveira', location: 'São Paulo, SP', age: 34, sentiment: 'Positivo', interest: 'Plano Master', status: 'Conversou hoje' },
  { id: 2, name: 'Ana Costa', location: 'Curitiba, PR', age: 28, sentiment: 'Neutro', interest: 'Dúvida Preço', status: 'Pendente' },
  { id: 3, name: 'Bruno Senna', location: 'Lisboa, PT', age: 41, sentiment: 'Negativo', interest: 'Acha caro', status: 'Perdido' },
  { id: 4, name: 'Clara Nunes', location: 'Rio de Janeiro, RJ', age: 25, sentiment: 'Positivo', interest: 'Comprou', status: 'Finalizado' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dash' | 'setup'>('dash');
  const [entities, setEntities] = useState([{ id: 1, name: 'nome_cliente', description: 'Coletar o nome completo do cliente' }]);

  const addEntity = () => {
    setEntities([...entities, { id: Date.now(), name: '', description: '' }]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Sidebar/Navigation Simple */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Eleven Chat</h1>
          <p className="text-gray-400 mt-2">Revenue Intelligence AI</p>
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
          {/* Grid de Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass-card p-6 border-l-4 border-indigo-500">
                <div className="flex justify-between mb-4">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold">{stat.label}</h3>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-8">
              <h2 className="text-xl font-bold mb-8">Interações Recentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="pb-4">Cliente</th>
                      <th className="pb-4">Localização</th>
                      <th className="pb-4">Interesse Detectado</th>
                      <th className="pb-4">Sentimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_INSIGHTS.map((insight) => (
                      <tr key={insight.id} className="border-b border-gray-900 hover:bg-white/5 transition">
                        <td className="py-4 font-medium">{insight.name}</td>
                        <td className="py-4 text-gray-400 text-sm">{insight.location}</td>
                        <td className="py-4 text-sm">{insight.interest}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${insight.sentiment === 'Positivo' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              insight.sentiment === 'Negativo' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-gray-800 text-gray-400'
                            }`}>
                            {insight.sentiment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card p-8">
              <h2 className="text-xl font-bold mb-8 text-indigo-400">Distribuição de Objeções</h2>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Preço alto</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <div className="w-full bg-[#050505] h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Dúvida Técnica</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="w-full bg-[#050505] h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Concorrência</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <div className="w-full bg-[#050505] h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto glass-card p-10">
          <h2 className="text-2xl font-bold mb-2">Configuração do Seu Agente de Vendas</h2>
          <p className="text-gray-400 mb-8">Defina a personalidade e o que seu robô deve extrair de inteligência.</p>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Área de Atuação</label>
                <input
                  type="text"
                  placeholder="Ex: Consultoria de Marketing, Imobiliária..."
                  className="w-full bg-[#050505] border border-gray-800 rounded-lg p-4 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nome do Robô</label>
                <input
                  type="text"
                  placeholder="Ex: Consultor Master"
                  className="w-full bg-[#050505] border border-gray-800 rounded-lg p-4 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Objetivo e Comportamento (Prompts)</label>
              <textarea
                rows={4}
                placeholder="Como o bot deve agir? Quem ele deve ser?"
                className="w-full bg-[#050505] border border-gray-800 rounded-lg p-4 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Campos de Inteligência (Data Collection)</label>
                <button onClick={addEntity} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline">
                  + Adicionar Campo
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Quais informações você quer que a IA extraia automaticamente da conversa?</p>

              <div className="space-y-4">
                {entities.map((entity, idx) => (
                  <div key={entity.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#101014] p-4 rounded-xl border border-gray-900">
                    <input
                      type="text"
                      placeholder="Nome do Campo (ex: email)"
                      className="bg-transparent border border-gray-800 rounded px-4 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="O que buscar? (ex: Extrair e-mail do cliente)"
                      className="bg-transparent border border-gray-800 rounded px-4 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-800 flex justify-end gap-4">
              <button className="bg-indigo-600 px-8 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition">
                Salvar e Atualizar Robô
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
