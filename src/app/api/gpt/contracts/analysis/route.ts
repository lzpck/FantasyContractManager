import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/gpt/contracts/analysis
 *
 * Análise de contratos para negociação
 *
 * Body:
 * {
 *   "playerName": "Josh Allen",
 *   "leagueId": "league-id",
 *   "analysisType": "extension" | "tag" | "trade" | "cut"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Acesso público para ChatGPT - sem autenticação necessária

    const body = await request.json();
    const { playerName, leagueId, analysisType } = body;

    if (!playerName) {
      return NextResponse.json({ error: 'Nome do jogador é obrigatório' }, { status: 400 });
    }

    if (!analysisType || !['extension', 'tag', 'trade', 'cut'].includes(analysisType)) {
      return NextResponse.json({ error: 'Tipo de análise inválido' }, { status: 400 });
    }

    // Buscar jogador e contratos
    const player = await prisma.player.findFirst({
      where: {
        name: {
          contains: playerName,
          mode: 'insensitive',
        },
      },
      include: {
        contracts: {
          where: leagueId
            ? {
                team: {
                  leagueId: leagueId,
                },
              }
            : {},
          include: {
            team: {
              include: {
                league: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    if (!player.contracts || player.contracts.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contrato encontrado para este jogador' },
        { status: 404 },
      );
    }

    const contract = player.contracts[0]; // Contrato mais recente
    const isLastYear = contract.yearsRemaining === 1;
    const canExtend = !contract.hasBeenExtended && isLastYear;
    const canTag = !contract.hasBeenTagged && isLastYear;

    let analysis: any = {
      player: {
        name: player.name,
        position: player.position,
        team: player.team,
      },
      contract: {
        id: contract.id,
        currentSalary: contract.currentSalary,
        yearsRemaining: contract.yearsRemaining,
        status: contract.status,
        hasBeenExtended: contract.hasBeenExtended,
        hasBeenTagged: contract.hasBeenTagged,
        team: contract.team
          ? {
              id: contract.team.id,
              name: contract.team.name,
              sleeperTeamId: contract.team.sleeperTeamId,
              league: contract.team.league,
            }
          : null,
      },
      analysisType,
      timestamp: new Date().toISOString(),
    };

    switch (analysisType) {
      case 'extension':
        analysis.result = {
          eligible: canExtend,
          reason: canExtend
            ? 'Jogador elegível para extensão (último ano de contrato e não foi estendido)'
            : contract.hasBeenExtended
              ? 'Jogador já foi estendido neste contrato'
              : 'Jogador não está no último ano de contrato',
          recommendation: canExtend
            ? 'Considere estender o contrato se o jogador tem bom desempenho'
            : 'Aguarde até o último ano do contrato para extensão',
          estimatedCost: canExtend ? Math.round(contract.currentSalary * 1.2) : null,
        };
        break;

      case 'tag':
        analysis.result = {
          eligible: canTag,
          reason: canTag
            ? 'Jogador elegível para franchise tag (último ano de contrato e não foi tagueado)'
            : contract.hasBeenTagged
              ? 'Jogador já foi tagueado neste contrato'
              : 'Jogador não está no último ano de contrato',
          recommendation: canTag
            ? 'Use franchise tag se quiser manter o jogador por mais um ano'
            : 'Franchise tag não disponível para este contrato',
          estimatedCost: canTag ? Math.round(contract.currentSalary * 1.5) : null,
        };
        break;

      case 'trade':
        const attractiveness =
          contract.yearsRemaining > 1 && contract.currentSalary < 15000000
            ? 'Alta'
            : contract.yearsRemaining === 1
              ? 'Baixa'
              : 'Média';

        analysis.result = {
          eligible: true,
          attractiveness,
          reason: `Contrato com ${contract.yearsRemaining} ano(s) restante(s) e salário de $${contract.currentSalary.toLocaleString()}`,
          recommendation:
            attractiveness === 'Alta'
              ? 'Bom momento para negociar - contrato atrativo'
              : attractiveness === 'Média'
                ? 'Negociação possível, mas pode precisar de incentivos'
                : 'Difícil de negociar - contrato expirando ou salário alto',
          marketValue: contract.currentSalary,
        };
        break;

      case 'cut':
        const shouldCut =
          contract.currentSalary > 20000000 ||
          (contract.yearsRemaining === 1 && contract.currentSalary > 10000000);

        analysis.result = {
          eligible: true,
          recommended: shouldCut,
          reason: shouldCut
            ? 'Salário alto justifica considerar o corte'
            : 'Salário dentro do esperado para a posição',
          recommendation: shouldCut
            ? 'Considere cortar para liberar espaço salarial'
            : 'Mantenha o jogador - bom custo-benefício',
          salarySavings: contract.currentSalary,
          capHit: Math.round(contract.currentSalary * 0.3), // Estimativa de dead money
        };
        break;

      default:
        return NextResponse.json({ error: 'Tipo de análise não suportado' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Erro na análise de contrato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
