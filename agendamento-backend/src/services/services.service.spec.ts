import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  service: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get(PrismaService);
  });

  const userId = 'user-uuid';
  const serviceData = { nome: 'Maquiagem', descricao: 'Completa', preco: 150, valor_sinal: 50, duracao_minutos: 60 };

  it('deve criar um serviço', async () => {
    const created = { id: 'svc-uuid', user_id: userId, ...serviceData, ativo: true };
    mockPrisma.service.create.mockResolvedValue(created);

    const result = await service.create(userId, serviceData);

    expect(mockPrisma.service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ user_id: userId, nome: 'Maquiagem' }),
    });
    expect(result).toEqual(created);
  });

  it('deve listar serviços do usuário', async () => {
    mockPrisma.service.findMany.mockResolvedValue([{ id: '1' }]);

    const result = await service.findAll(userId);

    expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    expect(result).toHaveLength(1);
  });

  it('deve encontrar um serviço por ID', async () => {
    mockPrisma.service.findFirst.mockResolvedValue({ id: 'svc-uuid', user_id: userId });

    const result = await service.findOne(userId, 'svc-uuid');

    expect(result).toEqual({ id: 'svc-uuid', user_id: userId });
  });

  it('deve lançar NotFoundException se serviço não existir', async () => {
    mockPrisma.service.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, 'inexistente')).rejects.toThrow(NotFoundException);
  });

  it('deve atualizar um serviço', async () => {
    mockPrisma.service.findFirst.mockResolvedValue({ id: 'svc-uuid', user_id: userId });
    mockPrisma.service.update.mockResolvedValue({ id: 'svc-uuid', nome: 'Atualizado' });

    const result = await service.update(userId, 'svc-uuid', { nome: 'Atualizado' });

    expect(mockPrisma.service.update).toHaveBeenCalledWith({
      where: { id: 'svc-uuid' },
      data: { nome: 'Atualizado' },
    });
    expect(result.nome).toBe('Atualizado');
  });

  it('deve remover um serviço', async () => {
    mockPrisma.service.findFirst.mockResolvedValue({ id: 'svc-uuid', user_id: userId });
    mockPrisma.service.delete.mockResolvedValue({ id: 'svc-uuid' });

    const result = await service.remove(userId, 'svc-uuid');

    expect(mockPrisma.service.delete).toHaveBeenCalledWith({ where: { id: 'svc-uuid' } });
    expect(result).toEqual({ id: 'svc-uuid' });
  });
});
