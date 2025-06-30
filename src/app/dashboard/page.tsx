'use client';

import { useAuth } from '@/hooks/useAuth';
import { useLeagues } from '@/hooks/useLeagues';
import { useTeams } from '@/hooks/useTeams';
import { useContracts } from '@/hooks/useContracts';
import { WelcomeCard } from '@/components/WelcomeCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Trophy, DollarSign, TrendingUp, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { leagues, loading: leaguesLoading } = useLeagues();
  const { teams, loading: teamsLoading } = useTeams();
  const { contracts, loading: contractsLoading } = useContracts();

  const loading = leaguesLoading || teamsLoading || contractsLoading;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WelcomeCard />

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ligas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagues.length}</div>
            <p className="text-xs text-muted-foreground">
              {leagues.length === 0 ? 'Nenhuma liga encontrada' : 'Ligas ativas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Times</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">
              {teams.length === 0 ? 'Nenhum time encontrado' : 'Times gerenciados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-xs text-muted-foreground">
              {contracts.length === 0 ? 'Nenhum contrato encontrado' : 'Contratos gerenciados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary Cap Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((leagues.reduce((sum, league) => sum + (league.salaryCap || 0), 0)) / 1000000).toFixed(0)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todas as ligas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seções principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ligas Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Minhas Ligas</CardTitle>
                <CardDescription>
                  Ligas onde você participa ou é comissário
                </CardDescription>
              </div>
              <Link href="/leagues">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Liga
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {leagues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma liga encontrada</p>
                <p className="text-sm">Crie sua primeira liga para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leagues.slice(0, 3).map((league) => (
                  <div key={league.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{league.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {league.totalTeams} times • Salary Cap: ${(league.salaryCap / 1000000).toFixed(0)}M
                      </p>
                    </div>
                    <Link href={`/leagues/${league.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Liga
                      </Button>
                    </Link>
                  </div>
                ))}
                {leagues.length > 3 && (
                  <div className="text-center pt-2">
                    <Link href="/leagues">
                      <Button variant="ghost" size="sm">
                        Ver todas as ligas ({leagues.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contratos Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contratos Recentes</CardTitle>
                <CardDescription>
                  Últimos contratos criados ou modificados
                </CardDescription>
              </div>
              <Link href="/contracts">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contrato
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contrato encontrado</p>
                <p className="text-sm">Crie seu primeiro contrato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.slice(0, 3).map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{contract.player?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${(contract.currentSalary / 1000000).toFixed(1)}M • {contract.yearsRemaining} anos restantes
                      </p>
                    </div>
                    <Badge variant={contract.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {contract.status}
                    </Badge>
                  </div>
                ))}
                {contracts.length > 3 && (
                  <div className="text-center pt-2">
                    <Link href="/contracts">
                      <Button variant="ghost" size="sm">
                        Ver todos os contratos ({contracts.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
