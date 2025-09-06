import { prisma } from '@/lib/prisma';
import { Team, League } from '@prisma/client';

/**
 * Tipo para representar um team com informações da liga
 */
export type TeamWithLeague = Team & {
  league: League;
};

/**
 * Busca todos os teams associados a um usuário
 * Inclui tanto o team associado via teamId quanto os teams que o usuário possui como owner
 *
 * @param userId - ID do usuário
 * @returns Array de teams com informações da liga
 */
export async function getUserTeams(userId: string): Promise<TeamWithLeague[]> {
  try {
    // Buscar teams que o usuário possui como owner
    const ownedTeams = await prisma.team.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        league: true,
      },
    });

    // Buscar informações do usuário para verificar se tem teamId associado
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    const teams: TeamWithLeague[] = [...ownedTeams];

    // Se o usuário tem um teamId associado e não está na lista de owned teams, adicionar
    if (user?.teamId) {
      const isAlreadyIncluded = ownedTeams.some(team => team.id === user.teamId);
      if (!isAlreadyIncluded) {
        const associatedTeam = await prisma.team.findUnique({
          where: { id: user.teamId },
          include: {
            league: true,
          },
        });
        if (associatedTeam) {
          teams.push(associatedTeam);
        }
      }
    }

    return teams;
  } catch (error) {
    console.error('Erro ao buscar teams do usuário:', error);
    return [];
  }
}

/**
 * Função helper para verificar se um usuário tem acesso a um team específico
 *
 * @param userId - ID do usuário
 * @param teamId - ID do team
 * @returns true se o usuário tem acesso ao team, false caso contrário
 */
export async function userHasAccessToTeam(userId: string, teamId: string): Promise<boolean> {
  try {
    const userTeams = await getUserTeams(userId);
    return userTeams.some(team => team.id === teamId);
  } catch (error) {
    console.error('Erro ao verificar acesso do usuário ao team:', error);
    return false;
  }
}

/**
 * Busca o team principal de um usuário
 * Prioriza o team associado via teamId, caso contrário retorna o primeiro team que possui como owner
 *
 * @param userId - ID do usuário
 * @returns Team principal do usuário ou null se não encontrado
 */
export async function getUserPrimaryTeam(userId: string): Promise<TeamWithLeague | null> {
  try {
    // Buscar teams que o usuário possui como owner
    const userTeams = await getUserTeams(userId);

    if (userTeams.length === 0) {
      return null;
    }

    // Buscar informações do usuário para verificar se tem teamId associado
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    // Se o usuário tem um teamId específico, priorizar esse team
    if (user?.teamId) {
      const priorityTeam = userTeams.find(team => team.id === user.teamId);
      if (priorityTeam) {
        return priorityTeam;
      }
    }

    // Caso contrário, retornar o primeiro team que possui como owner
    return userTeams[0];
  } catch (error) {
    console.error('Erro ao buscar team principal do usuário:', error);
    return null;
  }
}
