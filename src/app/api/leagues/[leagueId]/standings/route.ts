import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TeamStanding, TeamFinancialSummary } from '@/types';
import { SleeperRoster } from '@/services/sleeperService';

/**
 * Interface para resposta do endpoint de classificação
 */
interface StandingsResponse {
  success: boolean;
  standings: TeamStanding[];
  playoffTeamsCount: number;
  lastSync: string;
  error?: string;
  sleeperDataAvailable: boolean;
}

/**
 * Interface para dados de cache do Sleeper
 */
interface SleeperCache {
  rosters: SleeperRoster[];
  playoffTeams: number;
  timestamp: number;
  leagueId: string;
}

// Cache simples em memória para dados do Sleeper (válido por 5 minutos)
const sleeperCache = new Map<string, SleeperCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Valida dados de roster do Sleeper
 */
function validateSleeperRoster(roster: any): roster is SleeperRoster {
  if (!roster || typeof roster !== 'object') {
    return false;
  }

  // Verificar propriedades obrigatórias
  const requiredFields = ['roster_id', 'owner_id', 'settings'];
  for (const field of requiredFields) {
    if (!(field in roster)) {
      console.warn(`⚠️ Roster inválido: campo '${field}' ausente`);
      return false;
    }
  }

  // Validar settings
  if (!roster.settings || typeof roster.settings !== 'object') {
    console.warn('⚠️ Roster inválido: settings ausente ou inválido');
    return false;
  }

  // Verificar campos numéricos essenciais
  const numericFields = ['wins', 'losses', 'fpts', 'fpts_against'];
  for (const field of numericFields) {
    if (typeof roster.settings[field] !== 'number') {
      console.warn(`⚠️ Roster inválido: campo settings.${field} deve ser numérico`);
      return false;
    }
  }

  return true;
}

/**
 * Valida dados da liga do Sleeper
 */
function validateSleeperLeague(league: any): boolean {
  if (!league || typeof league !== 'object') {
    return false;
  }

  if (!league.settings || typeof league.settings !== 'object') {
    console.warn('⚠️ Liga do Sleeper inválida: settings ausente');
    return false;
  }

  return true;
}

/**
 * Busca dados do Sleeper com cache e validação
 */
async function fetchSleeperData(sleeperLeagueId: string): Promise<{
  rosters: SleeperRoster[];
  playoffTeams: number;
  validationErrors: string[];
} | null> {
  const validationErrors: string[] = [];

  try {
    // Verificar cache
    const cached = sleeperCache.get(sleeperLeagueId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Usando dados do Sleeper em cache para liga ${sleeperLeagueId}`);
      return {
        rosters: cached.rosters,
        playoffTeams: cached.playoffTeams,
        validationErrors: [],
      };
    }

    console.log(`🏈 Buscando dados do Sleeper para liga ${sleeperLeagueId}`);

    // Validar formato do ID da liga
    if (!sleeperLeagueId || typeof sleeperLeagueId !== 'string' || sleeperLeagueId.trim() === '') {
      const error = 'ID da liga do Sleeper inválido';
      console.error(`❌ ${error}`);
      validationErrors.push(error);
      return null;
    }

    // Buscar rosters com timeout
    const rostersController = new AbortController();
    const rostersTimeout = setTimeout(() => rostersController.abort(), 10000); // 10s timeout

    const rostersResponse = await fetch(
      `https://api.sleeper.app/v1/league/${sleeperLeagueId}/rosters`,
      {
        next: { revalidate: 300 },
        signal: rostersController.signal,
      },
    );

    clearTimeout(rostersTimeout);

    if (!rostersResponse.ok) {
      const error = `Erro HTTP ${rostersResponse.status} ao buscar rosters do Sleeper`;
      console.error(`❌ ${error}`);
      validationErrors.push(error);
      return null;
    }

    const rawRosters = await rostersResponse.json();

    // Validar se é um array
    if (!Array.isArray(rawRosters)) {
      const error = 'Resposta de rosters do Sleeper não é um array';
      console.error(`❌ ${error}`);
      validationErrors.push(error);
      return null;
    }

    // Validar cada roster individualmente
    const validRosters: SleeperRoster[] = [];
    const invalidRosters: any[] = [];

    rawRosters.forEach((roster, index) => {
      if (validateSleeperRoster(roster)) {
        validRosters.push(roster);
      } else {
        invalidRosters.push({ index, roster });
        validationErrors.push(`Roster ${index} inválido`);
      }
    });

    if (validRosters.length === 0) {
      const error = 'Nenhum roster válido encontrado no Sleeper';
      console.error(`❌ ${error}`);
      validationErrors.push(error);
      return null;
    }

    if (invalidRosters.length > 0) {
      console.warn(`⚠️ ${invalidRosters.length} rosters inválidos ignorados`);
    }

    // Buscar configurações da liga com timeout
    const leagueController = new AbortController();
    const leagueTimeout = setTimeout(() => leagueController.abort(), 10000);

    const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${sleeperLeagueId}`, {
      next: { revalidate: 300 },
      signal: leagueController.signal,
    });

    clearTimeout(leagueTimeout);

    let playoffTeams = 6; // Padrão
    if (leagueResponse.ok) {
      const leagueData = await leagueResponse.json();

      if (validateSleeperLeague(leagueData)) {
        const configuredPlayoffTeams = leagueData.settings?.playoff_teams;
        if (
          typeof configuredPlayoffTeams === 'number' &&
          configuredPlayoffTeams > 0 &&
          configuredPlayoffTeams <= 16
        ) {
          playoffTeams = configuredPlayoffTeams;
        } else {
          validationErrors.push('Configuração de playoff teams inválida, usando padrão (6)');
        }
      } else {
        validationErrors.push('Dados da liga do Sleeper inválidos, usando configurações padrão');
      }
    } else {
      const error = `Erro HTTP ${leagueResponse.status} ao buscar configurações da liga`;
      console.warn(`⚠️ ${error}`);
      validationErrors.push(error);
    }

    // Validações adicionais de consistência
    const uniqueOwnerIds = new Set(validRosters.map(r => r.owner_id));
    if (uniqueOwnerIds.size !== validRosters.length) {
      validationErrors.push('Rosters com owner_id duplicados encontrados');
    }

    const uniqueRosterIds = new Set(validRosters.map(r => r.roster_id));
    if (uniqueRosterIds.size !== validRosters.length) {
      validationErrors.push('Rosters com roster_id duplicados encontrados');
    }

    // Atualizar cache apenas com dados válidos
    sleeperCache.set(sleeperLeagueId, {
      rosters: validRosters,
      playoffTeams,
      timestamp: Date.now(),
      leagueId: sleeperLeagueId,
    });

    console.log(
      `✅ Dados do Sleeper validados: ${validRosters.length}/${rawRosters.length} rosters válidos, ${playoffTeams} playoff teams`,
    );

    if (validationErrors.length > 0) {
      console.warn(`⚠️ ${validationErrors.length} avisos de validação:`, validationErrors);
    }

    return {
      rosters: validRosters,
      playoffTeams,
      validationErrors,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeoutError = 'Timeout ao buscar dados do Sleeper';
        console.error(`❌ ${timeoutError}`);
        validationErrors.push(timeoutError);
      } else {
        console.error('❌ Erro ao buscar dados do Sleeper:', error.message);
        validationErrors.push(`Erro de rede: ${error.message}`);
      }
    } else {
      console.error('❌ Erro desconhecido ao buscar dados do Sleeper:', error);
      validationErrors.push('Erro desconhecido ao conectar com Sleeper');
    }
    return null;
  }
}

/**
 * Calcula dados financeiros de um time
 */
async function calculateTeamFinancials(
  team: any,
  salaryCap: number,
  currentSeason: number,
): Promise<TeamFinancialSummary> {
  try {
    // Buscar contratos ativos do time
    const contracts = await prisma.contract.findMany({
      where: {
        teamId: team.id,
        status: 'ACTIVE',
      },
      include: {
        player: true,
      },
    });

    // Calcular total de salários
    const totalSalaries = contracts.reduce((sum, contract) => {
      return sum + (contract.currentSalary || 0);
    }, 0);

    // Contar contratos expirando (1 ano restante)
    const contractsExpiring = contracts.filter(contract => contract.yearsRemaining === 1).length;

    // Buscar dead money
    const deadMoneyRecords = await prisma.deadMoney.findMany({
      where: {
        teamId: team.id,
        year: {
          in: [currentSeason, currentSeason + 1],
        },
      },
    });

    const currentDeadMoney = deadMoneyRecords
      .filter(dm => dm.year === currentSeason)
      .reduce((sum, dm) => sum + dm.amount, 0);

    const nextSeasonDeadMoney = deadMoneyRecords
      .filter(dm => dm.year === currentSeason + 1)
      .reduce((sum, dm) => sum + dm.amount, 0);

    // Calcular cap disponível
    const availableCap = salaryCap - totalSalaries - currentDeadMoney;

    // Projetar cap da próxima temporada (aumento de 15%)
    const projectedSalariesIncrease = totalSalaries * 0.15;
    const projectedNextSeasonCap =
      salaryCap - (totalSalaries + projectedSalariesIncrease) - nextSeasonDeadMoney;

    return {
      team: {
        ...team,
        abbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
        availableCap,
      },
      totalSalaries,
      availableCap,
      currentDeadMoney,
      nextSeasonDeadMoney,
      projectedNextSeasonCap,
      contractsExpiring,
      playersWithContracts: contracts.map(contractData => ({
        player: {
          ...contractData.player,
          nflTeam: contractData.player.team, // Mapear 'team' para 'nflTeam'
          position: contractData.player.position as any, // Cast para PlayerPosition
          fantasyPositions: contractData.player.fantasyPositions.split(',') as any[], // Converter string para array
        },
        contract: {
          ...contractData,
          player: undefined, // Remover referência circular
          status: contractData.status as any, // Cast para ContractStatus
          acquisitionType: contractData.acquisitionType as any, // Cast para AcquisitionType
        },
      })),
    };
  } catch (error) {
    console.error(`❌ Erro ao calcular dados financeiros do time ${team.name}:`, error);

    // Fallback com valores zerados
    return {
      team: {
        ...team,
        abbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
        availableCap: salaryCap,
      },
      totalSalaries: 0,
      availableCap: salaryCap,
      currentDeadMoney: 0,
      nextSeasonDeadMoney: 0,
      projectedNextSeasonCap: salaryCap,
      contractsExpiring: 0,
      playersWithContracts: [],
    };
  }
}

/**
 * Combina dados financeiros com dados do Sleeper
 */
function combineStandingsData(
  teamFinancials: TeamFinancialSummary[],
  sleeperRosters: SleeperRoster[],
  playoffTeams: number,
): TeamStanding[] {
  console.log(
    `🔗 Combinando dados: ${teamFinancials.length} times, ${sleeperRosters.length} rosters Sleeper`,
  );

  const standings: TeamStanding[] = [];

  teamFinancials.forEach(financial => {
    if (!financial.team) {
      console.warn('❌ Time inválido encontrado:', financial);
      return;
    }

    // Buscar dados do Sleeper
    const sleeperRoster = financial.team.sleeperOwnerId
      ? sleeperRosters.find(roster => roster.owner_id === financial.team.sleeperOwnerId)
      : null;

    if (!financial.team.sleeperOwnerId) {
      console.warn('⚠️ Time sem sleeperOwnerId encontrado:', financial.team.name);
    }

    if (!sleeperRoster && sleeperRosters.length > 0 && financial.team.sleeperOwnerId) {
      console.warn(
        `⚠️ Roster do Sleeper não encontrado para time ${financial.team.name} (sleeperOwnerId: ${financial.team.sleeperOwnerId})`,
      );
    }

    // Calcular pontos com decimais
    const pointsFor = sleeperRoster
      ? sleeperRoster.settings.fpts + (sleeperRoster.settings.fpts_decimal || 0) / 100
      : 0;
    const pointsAgainst = sleeperRoster
      ? sleeperRoster.settings.fpts_against +
        (sleeperRoster.settings.fpts_against_decimal || 0) / 100
      : 0;

    // Extrair dados de vitórias/derrotas
    const wins = sleeperRoster?.settings.wins ?? 0;
    const losses = sleeperRoster?.settings.losses ?? 0;
    const ties = sleeperRoster?.settings.ties ?? 0;
    const streak = sleeperRoster?.metadata?.streak || '-';

    // Calcular PCT (porcentagem de vitórias)
    const totalGames = wins + losses + ties;
    const pct = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0;

    const standing: TeamStanding = {
      position: 0, // Será calculado após ordenação
      team: financial.team,
      financialSummary: financial,
      wins,
      losses,
      ties,
      pointsFor,
      pointsAgainst,
      streak,
      pct,
      isPlayoffTeam: false, // Será calculado após ordenação
      sleeperData: sleeperRoster
        ? {
            rosterId: sleeperRoster.roster_id,
            ownerId: sleeperRoster.owner_id,
            settings: sleeperRoster.settings,
            metadata: sleeperRoster.metadata,
          }
        : undefined,
    };

    console.log(
      `📊 Time ${financial.team.name}: W-L-T ${wins}-${losses}-${ties}, PF: ${pointsFor.toFixed(2)}, Salary: $${financial.totalSalaries.toLocaleString()}`,
    );

    standings.push(standing);
  });

  // Ordenar por PCT (porcentagem de vitórias), depois por pontos feitos
  standings.sort((a, b) => {
    // Primeiro por PCT (decrescente)
    if (a.pct !== b.pct) {
      return b.pct - a.pct;
    }
    // Depois por pontos feitos (decrescente) como critério de desempate
    return b.pointsFor - a.pointsFor;
  });

  console.log(
    '🏆 Classificação ordenada:',
    standings.map((t, i) => `${i + 1}. ${t.team.name} (${t.wins}-${t.losses})`).join(', '),
  );

  // Atribuir posições e marcar zona de playoffs
  standings.forEach((standing, index) => {
    standing.position = index + 1;
    standing.isPlayoffTeam = index < playoffTeams;
  });

  if (playoffTeams > 0) {
    console.log(
      `🏆 Times de playoff (top ${playoffTeams}):`,
      standings
        .slice(0, playoffTeams)
        .map(t => t.team.name)
        .join(', '),
    );
  }

  return standings;
}

/**
 * GET /api/leagues/[leagueId]/standings
 *
 * Retorna a classificação atualizada da liga combinando dados locais com Sleeper
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const startTime = Date.now();

  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('❌ Tentativa de acesso não autenticado ao endpoint de classificação');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { leagueId } = await params;

    console.log(`🔄 Buscando classificação para liga ${leagueId} pelo usuário ${session.user.id}`);

    // Buscar liga no banco de dados
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: {
          include: {
            _count: {
              select: {
                contracts: {
                  where: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!league) {
      console.error(`❌ Liga ${leagueId} não encontrada`);
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    console.log(`📊 Liga encontrada: ${league.name} (${league.teams.length} times)`);

    // Calcular dados financeiros para todos os times
    const teamFinancials = await Promise.all(
      league.teams.map(team => calculateTeamFinancials(team, league.salaryCap, league.season)),
    );

    console.log(`✅ Dados financeiros calculados para ${teamFinancials.length} times`);

    // Buscar dados do Sleeper se disponível
    let sleeperData = null;
    let sleeperError = null;
    let validationErrors: string[] = [];
    let playoffTeams = 6; // Padrão

    if (league.sleeperLeagueId) {
      sleeperData = await fetchSleeperData(league.sleeperLeagueId);
      if (sleeperData) {
        playoffTeams = sleeperData.playoffTeams;
        validationErrors = sleeperData.validationErrors;

        // Log de avisos de validação se houver
        if (validationErrors.length > 0) {
          console.warn(`⚠️ Liga ${leagueId}: ${validationErrors.length} avisos de validação`);
        }
      } else {
        sleeperError =
          'Dados do Sleeper indisponíveis - Verifique se o ID da liga está correto e se a API está disponível';
      }
    } else {
      sleeperError = 'Liga não possui integração com Sleeper configurada';
    }

    // Combinar dados
    const standings = combineStandingsData(
      teamFinancials,
      sleeperData?.rosters || [],
      playoffTeams,
    );

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    const statusMessage =
      validationErrors.length > 0
        ? `com ${validationErrors.length} avisos de validação`
        : 'sem problemas';

    console.log(
      `✅ Classificação gerada em ${processingTime}ms: ${standings.length} times, ${sleeperData ? 'com' : 'sem'} dados do Sleeper (${statusMessage})`,
    );

    const response: StandingsResponse = {
      success: true,
      standings,
      playoffTeamsCount: playoffTeams,
      lastSync: new Date().toISOString(),
      sleeperDataAvailable: !!sleeperData,
      ...(sleeperError && { error: sleeperError }),
      ...(validationErrors.length > 0 && {
        validationWarnings: {
          count: validationErrors.length,
          messages: validationErrors,
        },
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.error(`❌ Erro ao buscar classificação após ${processingTime}ms:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
