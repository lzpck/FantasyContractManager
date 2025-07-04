import { NextRequest } from 'next/server';
import { GET, PATCH } from './route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';

// Mock das dependências
jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('@/lib/auth');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;

describe('/api/profile', () => {
  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    login: 'joao.silva',
    email: 'joao@example.com',
    role: 'USER',
    teamId: 'team-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    team: {
      id: 'team-1',
      name: 'Time Teste',
      league: {
        id: 'league-1',
        name: 'Liga Teste',
      },
    },
  };

  const mockSession = {
    user: {
      id: 'user-1',
      login: 'joao.silva',
      email: 'joao@example.com',
      name: 'João Silva',
      role: 'USER',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profile', () => {
    it('deve retornar dados do perfil do usuário autenticado', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          name: true,
          login: true,
          email: true,
          role: true,
        }),
      });
    });

    it('deve retornar erro 401 se usuário não estiver autenticado', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Não autorizado');
    });

    it('deve retornar erro 404 se usuário não for encontrado', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Usuário não encontrado');
    });
  });

  describe('PATCH /api/profile - Atualização de perfil', () => {
    it('deve atualizar dados do perfil com sucesso', async () => {
      const requestBody = {
        type: 'profile',
        name: 'João Silva Santos',
        email: 'joao.santos@example.com',
      };

      const updatedUser = {
        ...mockUser,
        name: 'João Silva Santos',
        email: 'joao.santos@example.com',
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findFirst.mockResolvedValue(null); // Email não está em uso
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Perfil atualizado com sucesso');
      expect(data.user).toEqual(updatedUser);
    });

    it('deve retornar erro se email já estiver em uso', async () => {
      const requestBody = {
        type: 'profile',
        name: 'João Silva',
        email: 'email.existente@example.com',
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'other-user' }); // Email em uso

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email já está em uso');
    });

    it('deve retornar erro de validação para dados inválidos', async () => {
      const requestBody = {
        type: 'profile',
        name: '', // Nome vazio
        email: 'email-invalido', // Email inválido
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dados inválidos');
      expect(data.details).toBeDefined();
    });
  });

  describe('PATCH /api/profile - Alteração de senha', () => {
    it('deve alterar senha com sucesso', async () => {
      const requestBody = {
        type: 'password',
        currentPassword: 'senhaAtual123',
        newPassword: 'novaSenha456',
        confirmPassword: 'novaSenha456',
      };

      const userWithPassword = {
        id: 'user-1',
        password: 'hashedCurrentPassword',
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(userWithPassword);
      mockVerifyPassword.mockResolvedValue(true); // Senha atual correta
      mockHashPassword.mockResolvedValue('hashedNewPassword');
      mockPrisma.user.update.mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Senha alterada com sucesso');
      expect(mockVerifyPassword).toHaveBeenCalledWith('senhaAtual123', 'hashedCurrentPassword');
      expect(mockHashPassword).toHaveBeenCalledWith('novaSenha456');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: 'hashedNewPassword',
          updatedAt: expect.any(String),
        },
      });
    });

    it('deve retornar erro se senha atual estiver incorreta', async () => {
      const requestBody = {
        type: 'password',
        currentPassword: 'senhaErrada',
        newPassword: 'novaSenha456',
        confirmPassword: 'novaSenha456',
      };

      const userWithPassword = {
        id: 'user-1',
        password: 'hashedCurrentPassword',
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(userWithPassword);
      mockVerifyPassword.mockResolvedValue(false); // Senha atual incorreta

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Senha atual incorreta');
    });

    it('deve retornar erro de validação se senhas não coincidirem', async () => {
      const requestBody = {
        type: 'password',
        currentPassword: 'senhaAtual123',
        newPassword: 'novaSenha456',
        confirmPassword: 'senhasDiferentes',
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dados inválidos');
    });

    it('deve retornar erro se nova senha for muito curta', async () => {
      const requestBody = {
        type: 'password',
        currentPassword: 'senhaAtual123',
        newPassword: '123', // Muito curta
        confirmPassword: '123',
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dados inválidos');
    });
  });

  describe('PATCH /api/profile - Casos gerais', () => {
    it('deve retornar erro 401 se usuário não estiver autenticado', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ type: 'profile', name: 'Teste' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Não autorizado');
    });

    it('deve retornar erro para tipo de operação inválido', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ type: 'invalid', name: 'Teste' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Tipo de operação inválido');
    });
  });
});
