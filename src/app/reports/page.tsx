'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActiveContractsReport } from '@/components/reports/ActiveContractsReport';
import { FreeAgentsReport } from '@/components/reports/FreeAgentsReport';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e exporte relatórios gerenciais da liga.
          </p>
        </div>

        <Tabs defaultValue="active-contracts" className="w-full">
          <TabsList className="mb-6 bg-slate-800/50 p-1 rounded-lg inline-flex">
            <TabsTrigger value="active-contracts">Contratos Ativos</TabsTrigger>
            <TabsTrigger value="free-agents">Free Agents</TabsTrigger>
          </TabsList>

          <TabsContent value="active-contracts" className="space-y-4">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-card-foreground">
                  Relatório de Contratos Ativos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Listagem completa de todos os contratos ativos na liga com opções de filtro e
                  exportação.
                </p>
              </div>
              <ActiveContractsReport />
            </div>
          </TabsContent>

          <TabsContent value="free-agents" className="space-y-4">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-card-foreground">
                  Relatório de Free Agents
                </h2>
                <p className="text-sm text-muted-foreground">
                  Listagem de jogadores disponíveis (sem contrato ativo) para importação no leilão.
                </p>
              </div>
              <FreeAgentsReport />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
