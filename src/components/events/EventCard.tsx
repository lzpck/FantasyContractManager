'use client';

import { useState } from 'react';
import { Event, EventStatus } from '@/types';
import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
   * Retorna classes customizadas para o badge
   */
  const getStatusBadgeClassName = (status: EventStatus) => {
    switch (status) {
      case EventStatus.UPCOMING:
        return 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/50';
      case EventStatus.ONGOING:
        return 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50';
      case EventStatus.COMPLETED:
        return 'bg-slate-700 text-slate-400 border-slate-600';
      default:
        return '';
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

    if (event.status === EventStatus.UPCOMING) {
      return `em ${formatDistanceToNow(startDate, { locale: ptBR })}`;
    }

    if (event.status === EventStatus.COMPLETED) {
      return `há ${formatDistanceToNow(startDate, { locale: ptBR })}`;
    }

    return 'agora';
  };

  return (
    <div className="group relative rounded-lg border border-slate-800 bg-slate-900/50 p-6 transition-all hover:bg-slate-800/80 hover:border-slate-700 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
              {event.name}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                'border-0 font-medium',
                getStatusBadgeClassName(event.status || EventStatus.UPCOMING),
              )}
            >
              {getStatusText(event.status || EventStatus.UPCOMING)}
            </Badge>
          </div>

          {event.description && (
            <p className="text-sm text-slate-400 line-clamp-2 max-w-2xl">{event.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-3 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300 font-medium">{formatEventPeriod()}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{getRelativeTime()}</span>
            </div>

            {event.creator && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                <span>por {event.creator.name}</span>
              </div>
            )}
          </div>
        </div>

        {isCommissioner && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-100"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-20 w-32 overflow-hidden rounded-md border border-slate-700 bg-slate-900 shadow-xl ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onEdit?.(event);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <Pencil className="mr-3 h-3.5 w-3.5 text-slate-400" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(event);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-800"
                    >
                      <Trash2 className="mr-3 h-3.5 w-3.5 text-red-500" />
                      Excluir
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
