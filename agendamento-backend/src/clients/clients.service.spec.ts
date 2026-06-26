import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  client: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get(PrismaService);
  });

  const userId = 'user-uuid';
  const clientData = { nome: 'Maria', telefone: '11999999999', email: 'maria@email.com' };

  it('deve criar um cliente', async () => {
    const created = { id: 'cli-uuid', user_id: userId, ...clientData };
    mockPrisma.client.create.mockResolvedValue(created);

    const result = await service.create(userId, clientData);

    expect(mockPrisma.client.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ user_id: userId, nome: 'Maria' }),
    });
    expect(result).toEqual(created);
  });

  it('deve listar clientes do usuário', async () => {
    mockPrisma.client.findMany.mockResolvedValue([{ id: '1' }]);

    const result = await service.findAll(userId);

    expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    expect(result).toHaveLength(1);
  });

  it('deve encontrar um cliente por ID', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'cli-uuid', user_id: userId });

    const result = await service.findOne(userId, 'cli-uuid');

    expect(result).toEqual({ id: 'cli-uuid', user_id: userId });
  });

  it('deve lançar NotFoundException se cliente não existir', async () => {
    mockPrisma.client.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, 'inexistente')).rejects.toThrow(NotFoundException);
  });

  it('deve atualizar um cliente', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'cli-uuid', user_id: userId });
    mockPrisma.client.update.mockResolvedValue({ id: 'cli-uuid', nome: 'Atualizado' });

    const result = await service.update(userId, 'cli-uuid', { nome: 'Atualizado' });

    expect(mockPrisma.client.update).toHaveBeenCalledWith({
      where: { id: 'cli-uuid' },
      data: { nome: 'Atualizado' },
    });
    expect(result.nome).toBe('Atualizado');
  });

  it('deve remover um cliente', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'cli-uuid', user_id: userId });
    mockPrisma.client.delete.mockResolvedValue({ id: 'cli-uuid' });

    const result = await service.remove(userId, 'cli-uuid');

    expect(mockPrisma.client.delete).toHaveBeenCalledWith({ where: { id: 'cli-uuid' } });
    expect(result).toEqual({ id: 'cli-uuid' });
  });
});
