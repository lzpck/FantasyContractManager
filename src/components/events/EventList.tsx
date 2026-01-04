'use client';

import { Event } from '@/types';
import { EventCard } from './EventCard';
import { CalendarIcon } from 'lucide-react';

/**
 * Props do componente EventList
 */
interface EventListProps {
  /** Lista de eventos */
  events: Event[];
  /** Se está carregando */
  loading: boolean;
  /** Se o usuário atual é comissário da liga */
  isCommissioner: boolean;
  /** Callback para editar evento */
  onEditEvent?: (event: Event) => void;
  /** Callback para excluir evento */
  onDeleteEvent?: (event: Event) => void;
}

/**
 * Componente para exibir lista de eventos
 */
export function EventList({
  events,
  loading,
  isCommissioner,
  onEditEvent,
  onDeleteEvent,
}: EventListProps) {
  // Loading state handled by parent mostly, but we can show simple skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-32 rounded-lg bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">Nenhum evento encontrado</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          {isCommissioner
            ? 'Clique em "Novo Evento" para adicionar.'
            : 'Não há eventos para exibir nesta categoria.'}
        </p>
      </div>
    );
  }

  // Lista de eventos
  return (
    <div className="space-y-4">
      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          isCommissioner={isCommissioner}
          onEdit={onEditEvent}
          onDelete={onDeleteEvent}
        />
      ))}
    </div>
  );
}
