import { EventsPageContainer } from '@/components/events/EventsPageContainer';

export const metadata = {
  title: 'Eventos da Liga | Fantasy Contract Manager',
  description: 'Gerencie calendário, drafts e eventos importantes.',
};

export default function EventsPage() {
  return (
    <div className="container mx-auto py-8">
      <EventsPageContainer />
    </div>
  );
}
