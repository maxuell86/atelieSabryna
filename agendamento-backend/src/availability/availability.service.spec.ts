import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  availabilityBlock: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
  },
};

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvailabilityService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
  });

  const userId = 'user-uuid';
  const dto = { data: '2026-07-01', horario_inicio: '09:00', horario_fim: '12:00', duracao_minutos: 60 };

  it('deve criar um bloco de disponibilidade', async () => {
    const created = { id: 'block-uuid', user_id: userId, ...dto, data: new Date(dto.data) };
    mockPrisma.availabilityBlock.create.mockResolvedValue(created);

    const result = await service.create(userId, dto);

    expect(mockPrisma.availabilityBlock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: userId,
        horario_inicio: '09:00',
        duracao_minutos: 60,
      }),
    });
    expect(result).toEqual(created);
  });

  it('deve listar blocos de disponibilidade', async () => {
    mockPrisma.availabilityBlock.findMany.mockResolvedValue([{ id: '1' }]);

    const result = await service.findAll(userId);

    expect(mockPrisma.availabilityBlock.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      orderBy: [{ data: 'asc' }, { horario_inicio: 'asc' }],
    });
    expect(result).toHaveLength(1);
  });

  it('deve listar blocos filtrando por data', async () => {
    mockPrisma.availabilityBlock.findMany.mockResolvedValue([]);

    await service.findAll(userId, '2026-07-01');

    expect(mockPrisma.availabilityBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ data: expect.any(Date) }) }),
    );
  });

  it('deve encontrar um bloco por ID', async () => {
    mockPrisma.availabilityBlock.findFirst.mockResolvedValue({ id: 'block-uuid', user_id: userId });

    const result = await service.findOne(userId, 'block-uuid');

    expect(result).toEqual({ id: 'block-uuid', user_id: userId });
  });

  it('deve lançar NotFound se bloco não existir', async () => {
    mockPrisma.availabilityBlock.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, 'inexistente')).rejects.toThrow(NotFoundException);
  });

  it('deve atualizar um bloco', async () => {
    mockPrisma.availabilityBlock.findFirst.mockResolvedValue({ id: 'block-uuid', user_id: userId });
    mockPrisma.availabilityBlock.update.mockResolvedValue({ id: 'block-uuid', horario_inicio: '10:00' });

    const result = await service.update(userId, 'block-uuid', { horario_inicio: '10:00' });

    expect(mockPrisma.availabilityBlock.update).toHaveBeenCalledWith({
      where: { id: 'block-uuid' },
      data: { horario_inicio: '10:00' },
    });
  });

  it('deve remover um bloco', async () => {
    mockPrisma.availabilityBlock.findFirst.mockResolvedValue({ id: 'block-uuid', user_id: userId });
    mockPrisma.availabilityBlock.delete.mockResolvedValue({ id: 'block-uuid' });

    const result = await service.remove(userId, 'block-uuid');

    expect(mockPrisma.availabilityBlock.delete).toHaveBeenCalledWith({ where: { id: 'block-uuid' } });
    expect(result).toEqual({ id: 'block-uuid' });
  });

  describe('generateSlots', () => {
    it('deve gerar slots disponíveis excluindo horários ocupados', async () => {
      mockPrisma.availabilityBlock.findMany.mockResolvedValue([
        { id: 'b1', horario_inicio: '09:00', horario_fim: '11:00', duracao_minutos: 60 },
      ]);
      mockPrisma.appointment.findMany.mockResolvedValue([
        { horario: '10:00' },
      ]);

      const slots = await service.generateSlots(userId, '2026-07-01');

      expect(slots).toEqual(['09:00']);
      expect(slots).not.toContain('10:00');
    });

    it('deve retornar lista vazia se não houver blocos', async () => {
      mockPrisma.availabilityBlock.findMany.mockResolvedValue([]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const slots = await service.generateSlots(userId, '2026-07-01');

      expect(slots).toEqual([]);
    });

    it('deve gerar múltiplos slots com duração de 30 minutos', async () => {
      mockPrisma.availabilityBlock.findMany.mockResolvedValue([
        { id: 'b1', horario_inicio: '09:00', horario_fim: '10:30', duracao_minutos: 30 },
      ]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const slots = await service.generateSlots(userId, '2026-07-01');

      expect(slots).toEqual(['09:00', '09:30', '10:00']);
    });
  });
});
