'use client';

import { Event } from '@/types';
import { EventCard } from './EventCard';
import { CalendarIcon } from '@heroicons/react/24/outline';

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
  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              {isCommissioner && (
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhum evento cadastrado
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {isCommissioner
            ? 'Que tal criar o primeiro evento da liga? Clique no botão "Novo Evento" para começar.'
            : 'Ainda não há eventos cadastrados nesta liga. O comissário pode criar eventos para manter todos informados.'}
        </p>
        {isCommissioner && (
          <div className="text-sm text-gray-400 dark:text-gray-500">
            💡 Dica: Eventos são ótimos para organizar drafts, reuniões e marcos importantes da liga
          </div>
        )}
      </div>
    );
  }

  // Lista de eventos
  return (
    <div className="space-y-4">
      {/* Header da lista */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {events.length === 1 ? '1 evento' : `${events.length} eventos`}
        </div>
      </div>

      {/* Timeline de eventos */}
      <div className="relative">
        {/* Linha da timeline (apenas se houver mais de um evento) */}
        {events.length > 1 && (
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        )}

        {/* Lista de eventos */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Indicador da timeline */}
              {events.length > 1 && (
                <div className="absolute left-4 top-6 w-4 h-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full z-10">
                  <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
              )}

              {/* Card do evento */}
              <div className={events.length > 1 ? 'ml-12' : ''}>
                <EventCard
                  event={event}
                  isCommissioner={isCommissioner}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé da lista */}
      {events.length > 0 && (
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isCommissioner
              ? 'Você pode editar ou excluir eventos clicando no menu de cada evento'
              : 'Entre em contato com o comissário para sugerir novos eventos'}
          </p>
        </div>
      )}
    </div>
  );
}
