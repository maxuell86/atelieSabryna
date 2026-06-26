import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  const registerDto = { nome: 'Maria', email: 'maria@email.com', senha: '123456', telefone: '11999999999' };

  describe('register', () => {
    it('deve registrar um novo usuário', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid', nome: 'Maria', email: 'maria@email.com', slug: 'maria-abc12',
      });

      const result = await service.register(registerDto);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nome: 'Maria', email: 'maria@email.com', telefone: '11999999999',
        }),
      });
      expect(result.slug).toMatch(/^maria-/);
    });

    it('deve lançar ConflictException se email já existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const user = {
      id: 'user-uuid', nome: 'Maria', email: 'maria@email.com',
      slug: 'maria-abc12', senha: 'hashed-password',
    };

    it('deve autenticar e retornar token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({ email: 'maria@email.com', senha: '123456' });

      expect(result.access_token).toBe('jwt-token');
      expect(result.user.email).toBe('maria@email.com');
    });

    it('deve lançar UnauthorizedException se email não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'wrong@email.com', senha: '123456' })).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha estiver errada', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'maria@email.com', senha: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    const user = { id: 'user-uuid', email: 'maria@email.com' };

    it('deve gerar token de reset', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);

      const result = await service.forgotPassword({ email: 'maria@email.com' });

      expect(result.token).toBeDefined();
      expect(result.message).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({ reset_token: expect.any(String), reset_expires: expect.any(Date) }),
      });
    });

    it('deve retornar mensagem genérica se email não existir (segurança)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'inexistente@email.com' });

      expect(result.message).toBeDefined();
      expect(result.token).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    const user = { id: 'user-uuid', email: 'maria@email.com' };

    it('deve redefinir a senha com token válido', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(user);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      mockPrisma.user.update.mockResolvedValue(user);

      const result = await service.resetPassword({ token: 'valid-token', senha: 'nova123' });

      expect(result.message).toBe('Senha alterada com sucesso.');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({ senha: 'new-hashed', reset_token: null, reset_expires: null }),
      });
    });

    it('deve lançar BadRequestException se token for inválido', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword({ token: 'invalid', senha: 'nova123' })).rejects.toThrow(BadRequestException);
    });
  });
});
