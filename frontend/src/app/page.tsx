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

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Eleven Chat Dashboard</h1>
          <p className="text-gray-400 mt-2">Inteligência de Vendas e Insights em Tempo Real</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-[#1e1e24] px-4 py-2 rounded-lg border border-gray-800 hover:bg-gray-800 transition">
            Exportar Dados
          </button>
          <button className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            Novo Agente
          </button>
        </div>
      </div>

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {STATS.map((stat) => (
          <div key={stat.label} className="glass-card p-6">
            <div className="flex justify-between mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">{stat.label}</h3>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Insights Recentes */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold mb-6">Insights Recentes dos Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="pb-4">Nome</th>
                  <th className="pb-4">Localização</th>
                  <th className="pb-4">Interesse</th>
                  <th className="pb-4">Sentimento</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_INSIGHTS.map((insight) => (
                  <tr key={insight.id} className="border-b border-gray-900 last:border-0">
                    <td className="py-4 font-medium">{insight.name}</td>
                    <td className="py-4 text-gray-400 text-sm">{insight.location}</td>
                    <td className="py-4 text-sm">{insight.interest}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs ${insight.sentiment === 'Positivo' ? 'bg-green-900/40 text-green-400' :
                          insight.sentiment === 'Negativo' ? 'bg-red-900/40 text-red-400' :
                            'bg-gray-800 text-gray-400'
                        }`}>
                        {insight.sentiment}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-400">{insight.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Pedidos / Objeções */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-6">Principais Objeções</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Preço muito alto</span>
                <span className="text-indigo-400">45%</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Dúvida sobre integração</span>
                <span className="text-indigo-400">30%</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full">
                <div className="bg-indigo-400 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Prazo de entrega</span>
                <span className="text-indigo-400">15%</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
            <h4 className="text-indigo-400 text-sm font-bold mb-2">Dica da IA:</h4>
            <p className="text-xs text-gray-300">
              Muitos clientes de SP estão questionando o preço do "Plano Master". Considere oferecer um cupom de 10% para fechar essas vendas hoje.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
