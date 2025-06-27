'use client';

import React from 'react';
import { DateDisplay } from './DateDisplay';

/**
 * Componente de exemplo para demonstrar o uso do DateDisplay
 */
export function DateDisplayExample() {
  const currentDate = new Date();
  const pastDate = new Date();
  pastDate.setMonth(pastDate.getMonth() - 3); // Data de 3 meses atrás

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Exemplos de DateDisplay</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Data e hora (padrão)</h3>
          <DateDisplay date={currentDate} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Apenas data (sem hora)</h3>
          <DateDisplay date={currentDate} includeTime={false} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Com ícone de calendário</h3>
          <DateDisplay date={currentDate} showIcon={true} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tamanho pequeno</h3>
          <DateDisplay date={currentDate} size="sm" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tamanho grande</h3>
          <DateDisplay date={currentDate} size="lg" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Com tooltip (passe o mouse)</h3>
          <DateDisplay date={currentDate} includeTime={false} showTooltip={true} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Data passada</h3>
          <DateDisplay date={pastDate} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Data inválida (mostra placeholder)
          </h3>
          <DateDisplay date={''} placeholder="Não disponível" />
        </div>
      </div>
    </div>
  );
}
