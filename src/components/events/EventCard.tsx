'use client';

import { useState } from 'react';
import { Event, EventStatus } from '@/types';
import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

/**
 * Props do componente EventCard
 */
interface EventCardProps {
  /** Dados do evento */
  event: Event;
  /** Se o usuário atual é comissário da liga */
  isCommissioner: boolean;
  /** Callback para editar evento */
  onEdit?: (event: Event) => void;
  /** Callback para excluir evento */
  onDelete?: (event: Event) => void;
}

/**
 * Componente para exibir um card de evento
 */
export function EventCard({ event, isCommissioner, onEdit, onDelete }: EventCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  /**
   * Retorna as classes CSS para o badge de status
   */
  const getStatusBadgeClasses = (status: EventStatus) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (status) {
      case EventStatus.UPCOMING:
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case EventStatus.ONGOING:
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case EventStatus.COMPLETED:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  /**
   * Retorna o texto do status
   */
  const getStatusText = (status: EventStatus) => {
    switch (status) {
      case EventStatus.UPCOMING:
        return 'Futuro';
      case EventStatus.ONGOING:
        return 'Em andamento';
      case EventStatus.COMPLETED:
        return 'Encerrado';
      default:
        return 'Desconhecido';
    }
  };

  /**
   * Formata a data de forma amigável
   */
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return `Hoje às ${format(date, 'HH:mm')}`;
    }

    if (isTomorrow(date)) {
      return `Amanhã às ${format(date, 'HH:mm')}`;
    }

    if (isYesterday(date)) {
      return `Ontem às ${format(date, 'HH:mm')}`;
    }

    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  /**
   * Formata o período do evento
   */
  const formatEventPeriod = () => {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    if (!endDate) {
      return formatEventDate(event.startDate);
    }

    const startFormatted = format(startDate, "dd/MM/yyyy 'às' HH:mm");
    const endFormatted = format(endDate, "dd/MM/yyyy 'às' HH:mm");

    // Se for no mesmo dia
    if (format(startDate, 'dd/MM/yyyy') === format(endDate, 'dd/MM/yyyy')) {
      return `${format(startDate, "dd/MM/yyyy 'de' HH:mm")} às ${format(endDate, 'HH:mm')}`;
    }

    return `${startFormatted} até ${endFormatted}`;
  };

  /**
   * Retorna o tempo relativo até o evento
   */
  const getRelativeTime = () => {
    const startDate = new Date(event.startDate);
    const now = new Date();

    if (event.status === EventStatus.UPCOMING) {
      return `em ${formatDistanceToNow(startDate, { locale: ptBR })}`;
    }

    if (event.status === EventStatus.COMPLETED) {
      return `há ${formatDistanceToNow(startDate, { locale: ptBR })}`;
    }

    return 'agora';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header do card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.name}</h3>
            <span className={getStatusBadgeClasses(event.status || EventStatus.UPCOMING)}>
              {getStatusText(event.status || EventStatus.UPCOMING)}
            </span>
          </div>

          {event.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Menu de ações (apenas para comissários) */}
        {isCommissioner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Opções do evento"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <button
                  onClick={() => {
                    onEdit?.(event);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  Editar evento
                </button>
                <button
                  onClick={() => {
                    onDelete?.(event);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Excluir evento
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informações do evento */}
      <div className="space-y-2">
        {/* Data e hora */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          <span>{formatEventPeriod()}</span>
        </div>

        {/* Tempo relativo */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-4 w-4 flex-shrink-0" />
          <span>{getRelativeTime()}</span>
        </div>

        {/* Criador do evento */}
        {event.creator && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            <span>Criado por {event.creator.name}</span>
          </div>
        )}
      </div>

      {/* Overlay para fechar menu */}
      {showMenu && <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />}
    </div>
  );
}
