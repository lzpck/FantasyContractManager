import React, { useState, useEffect, useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { EventStatus } from '@/types';

interface SidebarEventWidgetProps {
  leagueId: string;
  isCollapsed: boolean;
}

export function SidebarEventWidget({ leagueId, isCollapsed }: SidebarEventWidgetProps) {
  const { events, loading } = useEvents(leagueId);
  const [now, setNow] = useState(new Date());

  // Atualiza o contador a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { activeEvent, nextEvent } = useMemo(() => {
    if (!events.length) return { activeEvent: null, nextEvent: null };

    // Encontra o primeiro evento em andamento
    const active = events.find(e => e.status === EventStatus.ONGOING);

    // Encontra o próximo evento (primeiro upcoming)
    // Se não houver evento ativo, o próximo evento pode ser considerado o "destaque" se estiver próximo
    const next = events.find(e => e.status === EventStatus.UPCOMING);

    return { activeEvent: active, nextEvent: next };
  }, [events]);

  if (loading || (!activeEvent && !nextEvent)) {
    return null;
  }

  // Se não houver evento ativo, mostramos o próximo como destaque
  const featuredEvent = activeEvent || nextEvent;
  const secondaryEvent = activeEvent ? nextEvent : null; // Se o ativo for o destaque, o próximo é secundário

  if (!featuredEvent) return null;

  const isOngoing = featuredEvent.status === EventStatus.ONGOING;
  const targetDate = isOngoing
    ? featuredEvent.endDate
      ? new Date(featuredEvent.endDate)
      : null
    : new Date(featuredEvent.startDate);

  // Se for ongoing mas sem data de fim, não mostramos contador
  const showTimer = targetDate !== null;

  const getTimeRemaining = () => {
    if (!targetDate) return '';

    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return isOngoing ? 'Terminando...' : 'Começando...';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div
      className={`mt-auto border-t border-slate-700 bg-slate-800/50 ${
        isCollapsed ? 'p-2 pb-6' : 'p-4 pb-6'
      }`}
    >
      {/* Evento em Destaque */}
      <div className="flex flex-col">
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between mb-1'}`}
        >
          {!isCollapsed && (
            <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
              {isOngoing ? 'Acontecendo Agora' : 'Próximo Evento'}
            </span>
          )}
          {isCollapsed && (
            <span className="text-lg" title={featuredEvent.name}>
              {isOngoing ? '🔥' : '📅'}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <>
            <h3
              className="text-sm font-semibold text-slate-100 whitespace-normal break-words leading-tight"
              title={featuredEvent.name}
            >
              {featuredEvent.name}
            </h3>

            {showTimer && (
              <div className="mt-2 flex items-center text-xs font-mono text-slate-300 bg-slate-800 rounded px-2 py-1 border border-slate-700/50 w-fit">
                <span className="mr-1.5 text-slate-500">{isOngoing ? 'Fim:' : 'Início:'}</span>
                {getTimeRemaining()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Próximo Evento (Secundário) */}
      {!isCollapsed && secondaryEvent && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500 uppercase">A seguir</span>
            <div className="flex justify-between items-start gap-2">
              <span
                className="text-xs text-slate-300 whitespace-normal break-words leading-tight flex-1"
                title={secondaryEvent.name}
              >
                {secondaryEvent.name}
              </span>
              <span className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
                {new Date(secondaryEvent.startDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
