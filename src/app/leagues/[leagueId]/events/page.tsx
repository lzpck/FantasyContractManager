'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Event, CreateEventData, UpdateEventData } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { useLeague } from '@/hooks/useLeagues';
import { useToast } from '@/components/ui/Toast';
import { EventList } from '@/components/events/EventList';
import { EventForm } from '@/components/events/EventForm';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

/**
 * Página de eventos da liga
 */
export default function EventsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;

  const { league, loading: leagueLoading } = useLeague(leagueId);
  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents(leagueId);
  const { addToast, ToastContainer } = useToast();

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Event | null>(null);

  // Verificar se o usuário é comissário
  // TODO: Implementar verificação de permissão real
  const isCommissioner = true; // Por enquanto, assumir que é comissário

  /**
   * Manipula criação de novo evento
   */
  const handleCreateEvent = () => {
    setEditingEvent(undefined);
    setShowEventForm(true);
  };

  /**
   * Manipula edição de evento
   */
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  /**
   * Manipula exclusão de evento
   */
  const handleDeleteEvent = (event: Event) => {
    setShowDeleteConfirm(event);
  };

  /**
   * Confirma exclusão do evento
   */
  const confirmDeleteEvent = async () => {
    if (!showDeleteConfirm) return;

    try {
      await deleteEvent(showDeleteConfirm.id);
      addToast({
        type: 'success',
        message: 'Evento excluído com sucesso!',
      });
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      addToast({
        type: 'error',
        message: 'Erro ao excluir evento. Tente novamente.',
      });
    }
  };

  /**
   * Manipula submissão do formulário
   */
  const handleFormSubmit = async (data: CreateEventData | UpdateEventData) => {
    try {
      setFormLoading(true);

      if (editingEvent) {
        // Atualizar evento existente
        await updateEvent(editingEvent.id, data as UpdateEventData);
        addToast({
          type: 'success',
          message: 'Evento atualizado com sucesso!',
        });
      } else {
        // Criar novo evento
        await createEvent(data as CreateEventData);
        addToast({
          type: 'success',
          message: 'Evento criado com sucesso!',
        });
      }

      setShowEventForm(false);
      setEditingEvent(undefined);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      addToast({
        type: 'error',
        message: editingEvent
          ? 'Erro ao atualizar evento. Tente novamente.'
          : 'Erro ao criar evento. Tente novamente.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Fecha o formulário
   */
  const handleCloseForm = () => {
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  if (leagueLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Liga não encontrada
          </h1>
          <Link href="/leagues" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Voltar para ligas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link
              href={`/leagues/${leagueId}`}
              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {league.name}
            </Link>
            <span>/</span>
            <span>Eventos</span>
          </div>

          {/* Título e ações */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Eventos da Liga</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Acompanhe os eventos e marcos importantes da liga {league.name}
              </p>
            </div>

            {/* Botão de novo evento (apenas para comissários) */}
            {isCommissioner && (
              <button
                onClick={handleCreateEvent}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Novo Evento
              </button>
            )}
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <EventList
            events={events}
            loading={eventsLoading}
            isCommissioner={isCommissioner}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>

        {/* Modal de formulário */}
        <EventForm
          event={editingEvent}
          isOpen={showEventForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          loading={formLoading}
        />

        {/* Modal de confirmação de exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowDeleteConfirm(null)}
              />

              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      Excluir evento
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tem certeza que deseja excluir o evento &quot;{showDeleteConfirm.name}
                        &quot;? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDeleteEvent}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(null)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Container de toasts */}
        <ToastContainer />
      </div>
    </div>
  );
}
