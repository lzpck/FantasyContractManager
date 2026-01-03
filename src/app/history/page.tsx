import { HistoryPageContainer } from '@/components/history/HistoryPageContainer';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Histórico da Liga | Fantasy Contract Manager',
  description: 'Hall da Fama, classificações anuais e rivalidades históricas.',
};

export default async function HistoryPage() {
  const league = await prisma.league.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { sleeperLeagueId: true },
  });

  const leagueId = league?.sleeperLeagueId;

  if (!leagueId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">Configuração Ausente</h1>
        <p className="text-muted-foreground">
          O ID da liga Sleeper não foi encontrado no banco de dados.
          <br />
          Verifique se a liga foi importada e sincronizada corretamente.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <HistoryPageContainer leagueId={leagueId} />
    </div>
  );
}
