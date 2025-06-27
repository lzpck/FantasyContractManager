'use client';

import React from 'react';
import { formatDate } from '@/utils/formatUtils';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@/components/ui/Tooltip';

export interface DateDisplayProps {
  /** Data a ser exibida (Date ou string ISO) */
  date: Date | string;
  /** Se deve incluir o horário na formatação */
  includeTime?: boolean;
  /** Se deve mostrar ícone de calendário */
  showIcon?: boolean;
  /** Se deve mostrar tooltip com data completa quando includeTime=false */
  showTooltip?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Tamanho do texto */
  size?: 'sm' | 'base' | 'lg';
  /** Texto a ser exibido quando a data for nula ou inválida */
  placeholder?: string;
}

/**
 * Componente para exibição padronizada de datas no formato brasileiro
 */
export function DateDisplay({
  date,
  includeTime = true,
  showIcon = false,
  showTooltip = false,
  className = '',
  size = 'base',
  placeholder = '-',
}: DateDisplayProps) {
  // Formata a data usando a função de utilidade
  const formattedDate = formatDate(date, includeTime);

  // Se não houver data válida, exibe o placeholder
  if (!formattedDate) {
    return <span className={`text-gray-400 ${className}`}>{placeholder}</span>;
  }

  // Classes de tamanho
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  }[size];

  // Componente de exibição da data
  const dateElement = (
    <span className={`${sizeClasses} ${className}`}>
      {showIcon && <CalendarIcon className="inline-block w-4 h-4 mr-1 -mt-0.5 text-gray-500" />}
      {formattedDate}
    </span>
  );

  // Se não estiver mostrando o horário mas o tooltip estiver ativado,
  // mostra a data completa no tooltip
  if (!includeTime && showTooltip) {
    const fullDate = formatDate(date, true);
    return <Tooltip content={fullDate}>{dateElement}</Tooltip>;
  }

  return dateElement;
}

/**
 * Hook para formatar uma data no padrão brasileiro
 */
export function useDate(date: Date | string, options?: Partial<DateDisplayProps>) {
  const { includeTime = true } = options || {};
  const formattedDate = formatDate(date, includeTime);
  const isValid = !!formattedDate;

  return {
    formattedDate,
    isValid,
  };
}
