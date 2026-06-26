import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const mockPrisma = {
  user: { findUnique: jest.fn() },
};

const mockConfig = {
  get: jest.fn(),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfig.get.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('deve validar payload e retornar usuário', async () => {
    const user = { id: 'user-uuid', nome: 'Maria', email: 'maria@email.com', telefone: '11999999999' };
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const result = await strategy.validate({ sub: 'user-uuid', email: 'maria@email.com' });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-uuid' },
      select: { id: true, nome: true, email: true, telefone: true },
    });
    expect(result).toEqual(user);
  });

  it('deve lançar UnauthorizedException se usuário não existir', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'invalid', email: 'test@test.com' })).rejects.toThrow(UnauthorizedException);
  });
});
