'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeagues } from '@/hooks/useLeagues';
import { useEvents } from '@/hooks/useEvents';
import { EventList } from '@/components/events/EventList';
import { EventForm } from '@/components/events/EventForm';
import { useToast } from '@/components/ui/Toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Calendar as CalendarIcon, History } from 'lucide-react';
import type { Event, CreateEventData } from '@/types';
import { EventStatus } from '@/types';

export function EventsPageContainer() {
  const { isCommissioner } = useAuth();
  const { leagues, loading: leaguesLoading } = useLeagues();
  const { addToast, ToastContainer } = useToast();

  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Select first league automatically
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [leagues, selectedLeagueId]);

  const selectedLeague = leagues.find(l => l.id === selectedLeagueId) || null;

  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents(selectedLeagueId);

  // Filter events by tab
  const upcomingEvents = events.filter(
    e => !e.status || e.status === EventStatus.UPCOMING || e.status === EventStatus.ONGOING,
  );

  const pastEvents = events.filter(e => e.status === EventStatus.COMPLETED);

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  // Handlers
  const handleCreateEvent = async (data: CreateEventData) => {
    if (!selectedLeagueId) return;
    try {
      await createEvent(data);
      setShowEventForm(false);
      addToast({ type: 'success', message: 'Evento criado com sucesso.' });
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
      addToast({ type: 'success', message: 'Evento atualizado com sucesso.' });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao atualizar evento',
      });
    }
  };

  const handleDeleteEvent = (event: Event) => setEventToDelete(event);

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await deleteEvent(eventToDelete.id);
      addToast({ type: 'success', message: 'Evento excluído com sucesso.' });
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

  if (leaguesLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-lg font-medium text-muted-foreground">Carregando ligas...</span>
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-slate-800/50 p-6 mb-4">
          <CalendarIcon className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Nenhuma Liga Encontrada</h2>
        <p className="text-slate-400 max-w-md">
          Você precisa estar associado a pelo menos uma liga para visualizar e gerenciar eventos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Eventos da Liga</h1>
          <p className="text-slate-400">
            Gerencie o calendário, drafts e marcos importantes da sua liga.
          </p>
        </div>

        {/* Acts as a toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <select
              value={selectedLeagueId}
              onChange={e => setSelectedLeagueId(e.target.value)}
              className="w-[280px] appearance-none rounded-md bg-slate-900 border border-slate-700 py-2 pl-4 pr-10 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>
                Selecione uma liga
              </option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.season})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg
                className="h-4 w-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {selectedLeagueId && isCommissioner && (
            <Button
              onClick={() => setShowEventForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          )}
        </div>
      </div>

      {selectedLeague ? (
        <Tabs
          defaultValue="upcoming"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-0"
        >
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-900/50 border border-slate-800">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Em Aberto
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400"
            >
              <History className="mr-2 h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value={activeTab}
            className="p-0 bg-transparent border-0 shadow-none mt-0 animate-in slide-in-from-left-4 duration-300"
          >
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-200">
                      {activeTab === 'upcoming' ? 'Próximos Eventos' : 'Eventos Passados'}
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      {eventsLoading
                        ? 'Carregando...'
                        : `${displayedEvents.length} evento(s) encontrado(s)`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <EventList
                  events={displayedEvents}
                  loading={eventsLoading}
                  onEditEvent={e => {
                    setEditingEvent(e);
                    setShowEventForm(true); // Open modal with edit data
                  }}
                  onDeleteEvent={handleDeleteEvent}
                  isCommissioner={isCommissioner}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 text-slate-500">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">Nenhuma liga selecionada</h3>
          <p className="text-slate-500">Selecione uma liga acima para visualizar seus eventos.</p>
        </div>
      )}

      {/* Internal Modals */}
      <EventForm
        event={editingEvent || undefined}
        isOpen={showEventForm || !!editingEvent}
        onClose={() => {
          setEditingEvent(null);
          setShowEventForm(false);
        }}
        onSubmit={
          editingEvent ? data => handleUpdateEvent(editingEvent.id, data) : handleCreateEvent
        }
        loading={false}
      />

      <ConfirmationModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDeleteEvent}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${eventToDelete?.name}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={isDeleting}
      />

      <ToastContainer />
    </div>
  );
}
