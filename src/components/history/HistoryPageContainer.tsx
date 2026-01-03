'use client';

import { useEffect, useState } from 'react';
import { SeasonHistory } from '@/services/sleeperService';
import { ChampionsList } from './ChampionsList';
import { AnnualStandings } from './AnnualStandings';
import { HeadToHeadMatrix } from './HeadToHeadMatrix';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function HistoryPageContainer({ leagueId }: { leagueId: string }) {
  const [history, setHistory] = useState<SeasonHistory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('champions');

  // Fetch básico inicial
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/league/history?leagueId=${leagueId}`);
        if (!res.ok) throw new Error('Falha ao carregar histórico');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        setError('Erro ao carregar dados históricos. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (leagueId) fetchData();
  }, [leagueId]);

  // Fetch secundário para matchups quando aba de confrontos for ativada
  useEffect(() => {
    async function fetchMatchups() {
      if (
        activeTab === 'head-to-head' &&
        history &&
        history.length > 0 &&
        Object.keys(history[0].matchups || {}).length === 0
      ) {
        // Se a aba H2H está ativa e não temos matchups (checando o primeiro ano como proxy), busca matchups
        // Faremos refresh silencioso
        try {
          const res = await fetch(`/api/league/history?leagueId=${leagueId}&includeMatchups=true`);
          if (res.ok) {
            const detailedData = await res.json();
            setHistory(detailedData);
          }
        } catch (e) {
          console.error('Silent refresh for matchups failed', e);
        }
      }
    }
    fetchMatchups();
  }, [activeTab, leagueId, history]); // Dependência circular potencial, mas controlada por checagem de history[0].matchups

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-lg font-medium text-muted-foreground">
          Carregando legado da liga...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/50 bg-red-500/10">
        <CardContent className="pt-6 text-center text-red-500">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">Nenhum histórico encontrado.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Histórico da Liga</h1>
        <p className="text-muted-foreground">
          Hall da Fama, classificações anuais e matriz de rivalidades.
        </p>
      </div>

      <Tabs defaultValue="champions" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="champions">Campeões</TabsTrigger>
          <TabsTrigger value="standings">Classificação</TabsTrigger>
          <TabsTrigger value="head-to-head">Confrontos</TabsTrigger>
        </TabsList>

        <TabsContent value="champions" className="animate-in fade-in-50 duration-500">
          <ChampionsList history={history} />
        </TabsContent>

        <TabsContent value="standings" className="animate-in fade-in-50 duration-500">
          <AnnualStandings history={history} />
        </TabsContent>

        <TabsContent value="head-to-head" className="animate-in fade-in-50 duration-500">
          <HeadToHeadMatrix history={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
