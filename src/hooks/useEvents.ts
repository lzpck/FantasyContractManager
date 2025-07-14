import { useState, useEffect, useCallback } from 'react';
import { Event, CreateEventData, UpdateEventData, EventStatus } from '@/types';

/**
 * Hook para gerenciamento de eventos da liga
 *
 * Fornece funcionalidades para:
 * - Listar eventos de uma liga
 * - Criar novos eventos
 * - Atualizar eventos existentes
 * - Excluir eventos
 * - Calcular status dos eventos
 */
export function useEvents(leagueId: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula o status de um evento baseado nas datas
   */
  const calculateEventStatus = useCallback((event: Event): EventStatus => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    if (now < startDate) {
      return EventStatus.UPCOMING;
    }

    if (endDate && now > endDate) {
      return EventStatus.COMPLETED;
    }

    if (!endDate && now > startDate) {
      // Se não há data de fim e já passou da data de início,
      // considera como completado após 24 horas
      const oneDayAfterStart = new Date(startDate);
      oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);

      if (now > oneDayAfterStart) {
        return EventStatus.COMPLETED;
      }
    }

    return EventStatus.ONGOING;
  }, []);

  /**
   * Busca todos os eventos da liga
   */
  const fetchEvents = useCallback(async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${leagueId}/events`);

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos');
      }

      const data = await response.json();

      // Adicionar status calculado a cada evento
      const eventsWithStatus = data.events.map((event: Event) => ({
        ...event,
        status: calculateEventStatus(event),
      }));

      setEvents(eventsWithStatus);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [leagueId, calculateEventStatus]);

  /**
   * Cria um novo evento
   */
  const createEvent = useCallback(
    async (eventData: CreateEventData): Promise<Event> => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar evento');
        }

        const data = await response.json();
        const newEvent = {
          ...data.event,
          status: calculateEventStatus(data.event),
        };

        // Atualizar lista local
        setEvents(prev =>
          [...prev, newEvent].sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          ),
        );

        return newEvent;
      } catch (err) {
        console.error('Erro ao criar evento:', err);
        throw err;
      }
    },
    [leagueId, calculateEventStatus],
  );

  /**
   * Atualiza um evento existente
   */
  const updateEvent = useCallback(
    async (eventId: string, eventData: UpdateEventData): Promise<Event> => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/events/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar evento');
        }

        const data = await response.json();
        const updatedEvent = {
          ...data.event,
          status: calculateEventStatus(data.event),
        };

        // Atualizar lista local
        setEvents(prev =>
          prev
            .map(event => (event.id === eventId ? updatedEvent : event))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
        );

        return updatedEvent;
      } catch (err) {
        console.error('Erro ao atualizar evento:', err);
        throw err;
      }
    },
    [leagueId, calculateEventStatus],
  );

  /**
   * Exclui um evento
   */
  const deleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/events/${eventId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao excluir evento');
        }

        // Remover da lista local
        setEvents(prev => prev.filter(event => event.id !== eventId));
      } catch (err) {
        console.error('Erro ao excluir evento:', err);
        throw err;
      }
    },
    [leagueId],
  );

  /**
   * Recarrega a lista de eventos
   */
  const refreshEvents = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Carregar eventos ao montar o componente ou quando leagueId mudar
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Atualizar status dos eventos a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev =>
        prev.map(event => ({
          ...event,
          status: calculateEventStatus(event),
        })),
      );
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [calculateEventStatus]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
  };
}

/**
 * Hook para buscar um evento específico
 */
export function useEvent(leagueId: string, eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!leagueId || !eventId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${leagueId}/events/${eventId}`);

      if (!response.ok) {
        throw new Error('Evento não encontrado');
      }

      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      console.error('Erro ao buscar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [leagueId, eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    loading,
    error,
    refetch: fetchEvent,
  };
}
