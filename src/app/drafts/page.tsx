import { DraftsPageContainer } from '@/components/drafts/DraftsPageContainer';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Drafts | Fantasy Contract Manager',
  description: 'Acompanhe a ordem do Draft de Rookies, salary cap de cada pick e muito mais.',
};

export default async function DraftsPage() {
  const league = await prisma.league.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  const leagueId = league?.id;

  if (!leagueId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">Liga não encontrada</h1>
        <p className="text-muted-foreground">
          Nenhuma liga foi encontrada no sistema. Cadastre uma liga primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <DraftsPageContainer leagueId={leagueId} />
    </div>
  );
}
