'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeagues } from '@/hooks/useLeagues';
import { useEvents } from '@/hooks/useEvents';
import { EventList } from '@/components/events/EventList';
import { EventForm } from '@/components/events/EventForm';
import { useToast } from '@/components/ui/Toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { League, Event, CreateEventData } from '@/types';

/**
 * Página principal de eventos
 *
 * Permite visualizar e gerenciar eventos de todas as ligas do usuário.
 * Inclui seletor de liga similar ao dashboard.
 */
export default function EventsPage() {
  const { user, isCommissioner } = useAuth();
  const { leagues, loading: leaguesLoading } = useLeagues();
  const { addToast, ToastContainer } = useToast();

  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents(selectedLeague?.id || '');

  // Selecionar primeira liga automaticamente quando carregadas
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeague) {
      setSelectedLeague(leagues[0]);
    }
  }, [leagues, selectedLeague]);

  // Handlers para eventos
  const handleCreateEvent = async (data: CreateEventData) => {
    if (!selectedLeague) return;

    try {
      await createEvent(data);
      setShowEventForm(false);
      addToast({
        type: 'success',
        message: 'O evento foi criado com sucesso.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao criar evento',
      });
    }
  };

  const handleUpdateEvent = async (eventId: string, data: CreateEventData) => {
    try {
      await updateEvent(eventId, data);
      setEditingEvent(null);
      addToast({
        type: 'success',
        message: 'O evento foi atualizado com sucesso.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao atualizar evento',
      });
    }
  };

  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      setIsDeleting(true);
      await deleteEvent(eventToDelete.id);
      addToast({
        type: 'success',
        message: 'O evento foi excluído com sucesso.',
      });
      setEventToDelete(null);
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao excluir evento',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteEvent = () => {
    setEventToDelete(null);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setShowEventForm(false);
  };

  if (leaguesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando ligas...</p>
        </div>
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Nenhuma Liga Encontrada</h2>
          <p className="text-slate-400 mb-6">
            Você precisa estar associado a pelo menos uma liga para visualizar eventos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
              <p className="text-slate-400 mt-1">Gerencie eventos e atividades das suas ligas</p>
            </div>

            {/* Seletor de Liga */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedLeague?.id || ''}
                onChange={e => {
                  const league = leagues.find(l => l.id === e.target.value);
                  setSelectedLeague(league || null);
                }}
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione uma liga</option>
                {leagues.map(league => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.season})
                  </option>
                ))}
              </select>

              {selectedLeague && isCommissioner && (
                <button
                  onClick={() => setShowEventForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>📅</span>
                  Novo Evento
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        {selectedLeague ? (
          <div className="space-y-6">
            {/* Informações da Liga Selecionada */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🏆</div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selectedLeague.name}</h2>
                  <p className="text-slate-400">
                    Temporada {selectedLeague.season} • {selectedLeague.totalTeams} times
                  </p>
                </div>
              </div>
            </div>

            {/* Modal de Formulário de Evento */}
            <EventForm
              event={editingEvent || undefined}
              isOpen={showEventForm || !!editingEvent}
              onClose={handleCancelEdit}
              onSubmit={
                editingEvent ? data => handleUpdateEvent(editingEvent.id, data) : handleCreateEvent
              }
              loading={false}
            />

            {/* Lista de Eventos */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-foreground">Eventos da Liga</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {events.length} evento(s) encontrado(s)
                </p>
              </div>

              <div className="p-6">
                <EventList
                  events={events}
                  loading={eventsLoading}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleDeleteEvent}
                  isCommissioner={isCommissioner}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-12 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Selecione uma Liga</h3>
            <p className="text-slate-400">
              Escolha uma liga no seletor acima para visualizar seus eventos.
            </p>
          </div>
        )}
      </div>

      <ToastContainer />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={!!eventToDelete}
        onClose={cancelDeleteEvent}
        onConfirm={confirmDeleteEvent}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${eventToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}
