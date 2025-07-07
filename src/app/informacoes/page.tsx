'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  InformationCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface LeagueRule {
  id: string;
  leagueName: string;
  title: string;
  description: string;
  createdAt: string;
}

interface BugReport {
  type: 'bug' | 'suggestion' | 'question';
  title: string;
  description: string;
  email: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function InformacoesPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'rules' | 'contact' | 'report'>('rules');

  // Estados para regras das ligas
  const [leagueRules, setLeagueRules] = useState<LeagueRule[]>([
    {
      id: '1',
      leagueName: 'Liga The Bad Place',
      title: 'Salary Cap',
      description: 'Teto salarial de $279.000.000 por temporada.',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      leagueName: 'Liga The Bad Place',
      title: 'Aumentos Salariais',
      description: 'Aumento automático de 15% a cada virada de temporada (1º de abril).',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<LeagueRule | null>(null);
  const [newRule, setNewRule] = useState({
    leagueName: '',
    title: '',
    description: '',
  });

  // Estados para report de bugs
  const [bugReport, setBugReport] = useState<BugReport>({
    type: 'bug',
    title: '',
    description: '',
    email: '',
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // ============================================================================
  // FUNÇÕES PARA REGRAS DAS LIGAS
  // ============================================================================

  const handleAddRule = () => {
    if (!newRule.leagueName.trim() || !newRule.title.trim() || !newRule.description.trim()) {
      addToast({ message: 'Todos os campos são obrigatórios', type: 'error' });
      return;
    }

    const rule: LeagueRule = {
      id: Date.now().toString(),
      leagueName: newRule.leagueName,
      title: newRule.title,
      description: newRule.description,
      createdAt: new Date().toISOString(),
    };

    setLeagueRules(prev => [...prev, rule]);
    setNewRule({ leagueName: '', title: '', description: '' });
    setIsAddingRule(false);
    addToast({ message: 'Regra adicionada com sucesso!', type: 'success' });
  };

  const handleEditRule = (rule: LeagueRule) => {
    setEditingRule(rule);
    setNewRule({
      leagueName: rule.leagueName,
      title: rule.title,
      description: rule.description,
    });
    setIsAddingRule(true);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;

    if (!newRule.leagueName.trim() || !newRule.title.trim() || !newRule.description.trim()) {
      addToast({ message: 'Todos os campos são obrigatórios', type: 'error' });
      return;
    }

    setLeagueRules(prev =>
      prev.map(rule =>
        rule.id === editingRule.id
          ? {
              ...rule,
              leagueName: newRule.leagueName,
              title: newRule.title,
              description: newRule.description,
            }
          : rule,
      ),
    );

    setNewRule({ leagueName: '', title: '', description: '' });
    setIsAddingRule(false);
    setEditingRule(null);
    addToast({ message: 'Regra atualizada com sucesso!', type: 'success' });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      setLeagueRules(prev => prev.filter(rule => rule.id !== ruleId));
      addToast({ message: 'Regra excluída com sucesso!', type: 'success' });
    }
  };

  const cancelEdit = () => {
    setIsAddingRule(false);
    setEditingRule(null);
    setNewRule({ leagueName: '', title: '', description: '' });
  };

  // ============================================================================
  // FUNÇÕES PARA REPORT DE BUGS
  // ============================================================================

  const handleSubmitReport = async () => {
    if (!bugReport.title.trim() || !bugReport.description.trim() || !bugReport.email.trim()) {
      addToast({ message: 'Todos os campos são obrigatórios', type: 'error' });
      return;
    }

    if (!bugReport.email.includes('@')) {
      addToast({ message: 'Por favor, insira um email válido', type: 'error' });
      return;
    }

    setIsSubmittingReport(true);

    try {
      // Simular envio do report (aqui você implementaria a integração com API)
      await new Promise(resolve => setTimeout(resolve, 1500));

      setBugReport({
        type: 'bug',
        title: '',
        description: '',
        email: '',
      });

      addToast({ message: 'Report enviado com sucesso! Obrigado pelo feedback.', type: 'success' });
    } catch (error) {
      addToast({ message: 'Erro ao enviar report. Tente novamente.', type: 'error' });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Informações</h1>
          <p className="text-slate-400">
            Regras das ligas, informações de contato e suporte ao usuário
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'rules', label: 'Regras das Ligas', icon: InformationCircleIcon },
                { id: 'contact', label: 'Contato', icon: EnvelopeIcon },
                { id: 'report', label: 'Report & Sugestões', icon: ExclamationTriangleIcon },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="bg-slate-900 rounded-xl p-6">
          {/* Tab: Regras das Ligas */}
          {activeTab === 'rules' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-100">Regras das Ligas</h2>
                <button
                  onClick={() => setIsAddingRule(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar Regra
                </button>
              </div>

              {/* Formulário de Adicionar/Editar Regra */}
              {isAddingRule && (
                <div className="bg-slate-800 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-slate-100 mb-4">
                    {editingRule ? 'Editar Regra' : 'Nova Regra'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nome da Liga
                      </label>
                      <input
                        type="text"
                        value={newRule.leagueName}
                        onChange={e =>
                          setNewRule(prev => ({ ...prev, leagueName: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Liga The Bad Place"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Título da Regra
                      </label>
                      <input
                        type="text"
                        value={newRule.title}
                        onChange={e => setNewRule(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Salary Cap"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={newRule.description}
                      onChange={e => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva a regra em detalhes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={editingRule ? handleUpdateRule : handleAddRule}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {editingRule ? 'Atualizar' : 'Adicionar'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Regras */}
              <div className="space-y-4">
                {leagueRules.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <InformationCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma regra cadastrada ainda.</p>
                  </div>
                ) : (
                  leagueRules.map(rule => (
                    <div key={rule.id} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-slate-100">{rule.title}</h3>
                          <p className="text-sm text-blue-400">{rule.leagueName}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300">{rule.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Criado em {new Date(rule.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Contato */}
          {activeTab === 'contact' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-6">Informações de Contato</h2>
              <div className="max-w-2xl">
                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-slate-100 mb-4">
                    Desenvolvedor do Sistema
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <EnvelopeIcon className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="text-slate-100">zepechoukaleandro@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 text-green-400">💬</span>
                      <div>
                        <p className="text-sm text-slate-400">WhatsApp</p>
                        <p className="text-slate-100">(41) 99847-2047</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 text-purple-400">🎮</span>
                      <div>
                        <p className="text-sm text-slate-400">Discord</p>
                        <p className="text-slate-100">lzpck</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 text-gray-400">🐙</span>
                      <div>
                        <p className="text-sm text-slate-400">GitHub</p>
                        <a 
                          href="https://github.com/lzpck" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          https://github.com/lzpck
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      💡 Sinta-se à vontade para entrar em contato para dúvidas, sugestões ou reportar problemas!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Report & Sugestões */}
          {activeTab === 'report' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-6">
                Report de Bugs & Sugestões
              </h2>
              <div className="max-w-2xl">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tipo</label>
                  <select
                    value={bugReport.type}
                    onChange={e => setBugReport(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bug">🐛 Bug / Erro</option>
                    <option value="suggestion">💡 Sugestão</option>
                    <option value="question">❓ Dúvida</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
                  <input
                    type="text"
                    value={bugReport.title}
                    onChange={e => setBugReport(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva brevemente o problema ou sugestão"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                  <textarea
                    value={bugReport.description}
                    onChange={e => setBugReport(prev => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Forneça detalhes sobre o problema, passos para reproduzir, ou sua sugestão..."
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Seu Email</label>
                  <input
                    type="email"
                    value={bugReport.email}
                    onChange={e => setBugReport(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmittingReport}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isSubmittingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Enviar Report
                    </>
                  )}
                </button>

                <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-100 mb-2">
                    📋 Dicas para um bom report:
                  </h3>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Seja específico sobre o problema ou sugestão</li>
                    <li>• Inclua passos para reproduzir bugs</li>
                    <li>• Mencione o navegador e dispositivo usado</li>
                    <li>• Anexe screenshots se possível (via email)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
