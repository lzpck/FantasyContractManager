import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole, LeagueStatus } from '@/types/database';
import { prisma } from '@/lib/prisma';
import { importLeagueFromSleeper, validateSleeperLeagueId } from '@/services/sleeperService';
import { League, TeamRoster } from '@/types';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ImportResult {
  success: boolean;
  league?: League;
  rosters?: TeamRoster[];
  message: string;
  details?: {
    teamsImported: number;
    playersImported: number;
  };
}

export interface ImportProgress {
  step: 'validating' | 'fetching' | 'transforming' | 'saving' | 'complete';
  message: string;
  progress: number; // 0-100
}

// ============================================================================
// FUNÇÕES DE IMPORTAÇÃO (MOVIDAS PARA O BACKEND)
// ============================================================================

/**
 * Importa uma liga da Sleeper API e salva no banco de dados
 */
async function importLeague(
  leagueId: string,
  commissionerId: string,
  customSettings?: {
    salaryCap?: number;
    maxFranchiseTags?: number;
    annualIncreasePercentage?: number;
    minimumSalary?: number;
    seasonTurnoverDate?: string;
    deadMoneyConfig?: any;
  },
): Promise<ImportResult> {
  try {
    // Etapa 1: Validação
    const isValid = await validateSleeperLeagueId(leagueId);
    if (!isValid) {
      return {
        success: false,
        message: 'ID da liga inválido ou liga não encontrada na Sleeper.',
      };
    }

    // Verificar se a liga já existe
    const existingLeague = await prisma.league.findFirst({
      where: { sleeperLeagueId: leagueId },
    });

    if (existingLeague) {
      return {
        success: false,
        message: 'Esta liga já foi importada anteriormente.',
      };
    }

    // Etapa 2: Busca de dados
    const importedData = await importLeagueFromSleeper(leagueId, commissionerId);

    // Etapa 3: Salvamento no banco
    const createdLeague = await prisma.league.create({
      data: {
        name: importedData.league.name,
        season: importedData.league.season,
        salaryCap: customSettings?.salaryCap ?? importedData.league.salaryCap,
        totalTeams: importedData.league.totalTeams,
        sleeperLeagueId: importedData.league.sleeperLeagueId,
        commissionerId: importedData.league.commissionerId,
        maxFranchiseTags:
          customSettings?.maxFranchiseTags ?? importedData.league.settings.maxFranchiseTags,
        annualIncreasePercentage:
          customSettings?.annualIncreasePercentage ??
          importedData.league.settings.annualIncreasePercentage,
        minimumSalary: customSettings?.minimumSalary ?? importedData.league.settings.minimumSalary,
        seasonTurnoverDate:
          customSettings?.seasonTurnoverDate ?? importedData.league.settings.seasonTurnoverDate,
        deadMoneyConfig: customSettings?.deadMoneyConfig
          ? JSON.stringify(customSettings.deadMoneyConfig)
          : undefined,
      },
    });

    // Criar os times
    const createdTeams = await Promise.all(
      importedData.teams.map(team =>
        prisma.team.create({
          data: {
            name: team.name,
            leagueId: createdLeague.id,
            // ownerId deve ficar em branco - será preenchido apenas na associação manual
            ownerId: null, // Campo vazio até associação manual de usuário local
            sleeperTeamId: team.sleeperTeamId,
            sleeperOwnerId: team.sleeperOwnerId,
            ownerDisplayName: team.ownerDisplayName,
          },
        }),
      ),
    );

    // Parse do deadMoneyConfig se existir
    let deadMoneyConfig;
    if (createdLeague.deadMoneyConfig) {
      try {
        deadMoneyConfig =
          typeof createdLeague.deadMoneyConfig === 'string'
            ? JSON.parse(createdLeague.deadMoneyConfig)
            : createdLeague.deadMoneyConfig;
      } catch (error) {
        console.warn('Erro ao fazer parse do deadMoneyConfig:', error);
        deadMoneyConfig = undefined;
      }
    }

    // Transformar para o formato esperado pelo frontend
    const leagueWithSettings: League = {
      id: createdLeague.id,
      name: createdLeague.name,
      season: createdLeague.season,
      salaryCap: createdLeague.salaryCap,
      totalTeams: createdLeague.totalTeams,
      status: createdLeague.status as LeagueStatus,
      sleeperLeagueId: createdLeague.sleeperLeagueId || undefined,
      commissionerId: createdLeague.commissionerId,
      maxFranchiseTags: createdLeague.maxFranchiseTags,
      annualIncreasePercentage: createdLeague.annualIncreasePercentage,
      minimumSalary: createdLeague.minimumSalary,
      seasonTurnoverDate: createdLeague.seasonTurnoverDate,
      deadMoneyConfig,
      settings: {
        maxFranchiseTags: createdLeague.maxFranchiseTags,
        annualIncreasePercentage: createdLeague.annualIncreasePercentage,
        minimumSalary: createdLeague.minimumSalary,
        seasonTurnoverDate: createdLeague.seasonTurnoverDate,
        rookieDraft: importedData.league.settings.rookieDraft,
      },
      teams: createdTeams.map(team => ({
        id: team.id,
        name: team.name,
        leagueId: team.leagueId,
        ownerId: team.ownerId || '',
        abbreviation: team.name.substring(0, 3).toUpperCase(),
        availableCap: importedData.league.salaryCap,
        currentDeadMoney: 0,
        nextSeasonDeadMoney: 0,
        franchiseTagsUsed: 0,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
      createdAt: createdLeague.createdAt,
      updatedAt: createdLeague.updatedAt,
    };

    return {
      success: true,
      league: leagueWithSettings,
      rosters: importedData.rosters,
      message: `Liga "${createdLeague.name}" importada com sucesso!`,
      details: {
        teamsImported: createdTeams.length,
        playersImported: importedData.players.length,
      },
    };
  } catch (error) {
    console.error('Erro durante importação:', error);

    return {
      success: false,
      message:
        error instanceof Error
          ? `Erro na importação: ${error.message}`
          : 'Erro desconhecido durante a importação',
    };
  }
}

/**
 * Valida um ID de liga da Sleeper
 */
async function validateLeagueId(leagueId: string): Promise<boolean> {
  if (!leagueId || leagueId.trim().length === 0) {
    return false;
  }

  return validateSleeperLeagueId(leagueId.trim());
}

/**
 * Verifica se uma liga já foi importada
 */
async function checkLeagueExists(sleeperLeagueId: string): Promise<boolean> {
  try {
    const existingLeague = await prisma.league.findFirst({
      where: { sleeperLeagueId },
    });

    return !!existingLeague;
  } catch (error) {
    console.error('Erro ao verificar existência da liga:', error);
    return false;
  }
}

// ============================================================================
// ROTAS DA API
// ============================================================================

/**
 * POST /api/leagues/import
 *
 * Importa uma liga da Sleeper API
 * Requer autenticação e perfil COMMISSIONER
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é comissário
    if (session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas comissários podem importar ligas.' },
        { status: 403 },
      );
    }

    // Obter dados da requisição
    const {
      leagueId,
      salaryCap,
      maxFranchiseTags,
      annualIncreasePercentage,
      minimumSalary,
      seasonTurnoverDate,
      deadMoneyConfig,
    } = await request.json();

    if (!leagueId) {
      return NextResponse.json({ error: 'ID da liga é obrigatório' }, { status: 400 });
    }

    // Importar a liga
    const result = await importLeague(leagueId, session.user.id, {
      salaryCap,
      maxFranchiseTags,
      annualIncreasePercentage,
      minimumSalary,
      seasonTurnoverDate,
      deadMoneyConfig,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        league: result.league,
        message: result.message,
        details: result.details,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Erro na API de importação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * GET /api/leagues/import?leagueId=123
 *
 * Valida um ID de liga da Sleeper
 * Requer autenticação e perfil COMMISSIONER
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é comissário
    if (session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas comissários podem validar ligas.' },
        { status: 403 },
      );
    }

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json({ error: 'ID da liga é obrigatório' }, { status: 400 });
    }

    // Validar ID da liga
    const isValid = await validateLeagueId(leagueId);
    if (!isValid) {
      return NextResponse.json({
        valid: false,
        message: 'ID da liga inválido ou liga não encontrada na Sleeper.',
      });
    }

    // Verificar se já foi importada
    const exists = await checkLeagueExists(leagueId);
    if (exists) {
      return NextResponse.json({
        valid: false,
        message: 'Esta liga já foi importada anteriormente.',
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Liga válida e disponível para importação.',
    });
  } catch (error) {
    console.error('Erro na validação da liga:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
