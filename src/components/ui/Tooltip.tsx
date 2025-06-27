'use client';

import React, { useState, ReactNode } from 'react';

export interface TooltipProps {
  /** Conteúdo do tooltip */
  content: ReactNode;
  /** Elemento filho que acionará o tooltip */
  children: ReactNode;
  /** Posição do tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Classes CSS adicionais para o tooltip */
  className?: string;
  /** Atraso para exibir o tooltip (ms) */
  delay?: number;
}

/**
 * Componente de tooltip que exibe informações adicionais ao passar o mouse
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Classes de posicionamento
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  // Gerencia a exibição do tooltip com atraso
  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap ${positionClasses} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
