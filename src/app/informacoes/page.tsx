'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  InformationCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

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

  // Estados para report de bugs
  const [bugReport, setBugReport] = useState<BugReport>({
    type: 'bug',
    title: '',
    description: '',
    email: '',
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-100 mb-2">Regras das Ligas</h2>
                <p className="text-slate-400">Consulte as regras oficiais da liga The Bad Place</p>
              </div>

              {/* Card principal com link para o documento */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700 mb-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <InformationCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">
                    Regras Oficiais da Liga
                  </h3>
                  <p className="text-slate-400">
                    Acesse o documento completo com todas as regras da liga The Bad Place
                  </p>
                </div>

                {/* Link para o documento */}
                <div className="bg-slate-700/50 rounded-xl p-6 hover:bg-slate-700/70 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-100 mb-1">
                          Documento Oficial das Regras
                        </h4>
                        <p className="text-slate-400 text-sm">
                          Google Docs • Atualizado regularmente
                        </p>
                      </div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>

                  <div className="mt-4">
                    <a
                      href="https://docs.google.com/document/d/1XyA8oRaIE6JMm5lqHLumTNXMNZD1CphN5jR1ghfM0FE/edit?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      Acessar Regras Completas
                    </a>
                  </div>
                </div>
              </div>

              {/* Resumo das principais regras */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Contratos */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📝</span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-100">Contratos</h4>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>• Contratos de 1 a 4 anos</li>
                    <li>• Aumento de 15% por temporada</li>
                    <li>• Extensões no último ano</li>
                    <li>• Franchise Tag disponível</li>
                  </ul>
                </div>

                {/* Salary Cap */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💰</span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-100">Salary Cap</h4>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>• Teto de $279.000.000</li>
                    <li>• Dead money por cortes</li>
                    <li>• Gestão financeira estratégica</li>
                    <li>• Penalidades por excesso</li>
                  </ul>
                </div>

                {/* Draft & Waivers */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-100">Draft & Waivers</h4>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>• Rookie Draft de 3 rodadas</li>
                    <li>• FAAB para free agents</li>
                    <li>• Contratos automáticos</li>
                    <li>• Opção de 4º ano para 1ª rodada</li>
                  </ul>
                </div>
              </div>

              {/* Aviso importante */}
              <div className="mt-6 p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-200 font-medium mb-1">Importante</h4>
                    <p className="text-amber-200/80 text-sm">
                      As regras podem ser atualizadas durante a temporada. Sempre consulte o
                      documento oficial para ter as informações mais recentes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Contato */}
          {activeTab === 'contact' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Informações de Contato</h2>
                <p className="text-slate-400">
                  Entre em contato comigo para dúvidas, sugestões ou suporte
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                {/* Card Principal do Desenvolvedor */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">LZ</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">
                      Leandro Zepechouka
                    </h3>
                    <p className="text-slate-400">Desenvolvedor Full Stack</p>
                  </div>

                  {/* Grid de Contatos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Email */}
                    <div className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700/70 transition-all duration-200 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                          <EnvelopeIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-300 mb-1">Email</p>
                          <a
                            href="mailto:zepechoukaleandro@gmail.com"
                            className="text-slate-100 hover:text-blue-400 transition-colors break-all"
                          >
                            zepechoukaleandro@gmail.com
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700/70 transition-all duration-200 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                          <span className="text-xl">💬</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-300 mb-1">WhatsApp</p>
                          <a
                            href="https://wa.me/5541998472047"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-100 hover:text-green-400 transition-colors"
                          >
                            (41) 99847-2047
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Discord */}
                    <div className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700/70 transition-all duration-200 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                          <span className="text-xl">🎮</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-300 mb-1">Discord</p>
                          <p className="text-slate-100">lzpck</p>
                        </div>
                      </div>
                    </div>

                    {/* GitHub */}
                    <div className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700/70 transition-all duration-200 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center group-hover:bg-gray-500/30 transition-colors">
                          <span className="text-xl">🐙</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-300 mb-1">GitHub</p>
                          <a
                            href="https://github.com/lzpck"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-100 hover:text-blue-400 transition-colors"
                          >
                            github.com/lzpck
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mensagem de Boas-vindas */}
                  <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">💡</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-slate-100 mb-2">
                          Vamos conversar!
                        </h4>
                        <p className="text-slate-300 leading-relaxed">
                          Estou sempre disponível para ajudar com dúvidas sobre o sistema, receber
                          sugestões de melhorias ou resolver qualquer problema que você possa
                          encontrar. Não hesite em entrar em contato!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cards de Estatísticas/Info Adicional */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
                    <div className="text-2xl mb-2">⚡</div>
                    <h4 className="text-lg font-semibold text-slate-100 mb-1">Resposta Rápida</h4>
                    <p className="text-sm text-slate-400">Geralmente respondo em até 24h</p>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
                    <div className="text-2xl mb-2">🛠️</div>
                    <h4 className="text-lg font-semibold text-slate-100 mb-1">Suporte Técnico</h4>
                    <p className="text-sm text-slate-400">Ajuda com bugs e problemas</p>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
                    <div className="text-2xl mb-2">💭</div>
                    <h4 className="text-lg font-semibold text-slate-100 mb-1">Feedback</h4>
                    <p className="text-sm text-slate-400">Suas ideias são bem-vindas</p>
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
