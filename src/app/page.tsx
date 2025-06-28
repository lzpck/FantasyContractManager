import { WelcomeCard } from '@/components/WelcomeCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Fantasy Contract Manager</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Sistema de gerenciamento de contratos e salary cap para ligas de fantasy football.
            Gerencie contratos, extensões, franchise tags e dead money de forma automatizada.
          </p>
        </div>

        <WelcomeCard />

        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Funcionalidades Principais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Gerenciamento de Contratos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Contratos de 1-4 anos com aumentos automáticos de 15% por temporada
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Salary Cap</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Controle total do teto salarial com alertas e projeções
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Franchise Tags
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Sistema de tags para reter jogadores por mais uma temporada
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Dead Money</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Cálculo automático de dead money ao cortar jogadores
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Rookie Draft
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Contratos automáticos para rookies com opção de 4º ano
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Integração Sleeper
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Sincronização com a plataforma Sleeper para dados atualizados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
