import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  service: {
    findFirst: jest.fn(),
  },
  client: {
    findFirst: jest.fn(),
  },
  appointment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  const userId = 'user-uuid';
  const serviceData = { id: 'svc-uuid', preco: 150, valor_sinal: 50 };
  const clientData = { id: 'cli-uuid' };
  const dto = {
    client_id: 'cli-uuid',
    service_id: 'svc-uuid',
    data: '2026-07-01',
    horario: '14:30',
  };

  it('deve criar um agendamento', async () => {
    mockPrisma.service.findFirst.mockResolvedValue(serviceData);
    mockPrisma.client.findFirst.mockResolvedValue(clientData);
    mockPrisma.appointment.findFirst.mockResolvedValue(null);
    mockPrisma.appointment.create.mockResolvedValue({
      id: 'apt-uuid',
      user_id: userId,
      client: clientData,
      service: serviceData,
    });

    const result = await service.create(userId, dto);

    expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: userId,
        client_id: 'cli-uuid',
        service_id: 'svc-uuid',
        valor_servico: 150,
        valor_sinal: 50,
      }),
      include: { client: true, service: true },
    });
  });

  it('deve lançar NotFoundException se serviço não existir', async () => {
    mockPrisma.service.findFirst.mockResolvedValue(null);

    await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
  });

  it('deve lançar NotFoundException se cliente não existir', async () => {
    mockPrisma.service.findFirst.mockResolvedValue(serviceData);
    mockPrisma.client.findFirst.mockResolvedValue(null);

    await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
  });

  it('deve lançar ConflictException se horário já estiver ocupado', async () => {
    mockPrisma.service.findFirst.mockResolvedValue(serviceData);
    mockPrisma.client.findFirst.mockResolvedValue(clientData);
    mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(service.create(userId, dto)).rejects.toThrow(ConflictException);
  });

  it('deve listar agendamentos', async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([{ id: '1', client: {}, service: {} }]);

    const result = await service.findAll(userId);

    expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      include: { client: true, service: true },
      orderBy: [{ data: 'asc' }, { horario: 'asc' }],
    });
    expect(result).toHaveLength(1);
  });

  it('deve listar agendamentos filtrando por data', async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([]);

    await service.findAll(userId, '2026-07-01');

    expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ data: expect.any(Date) }) }),
    );
  });

  it('deve encontrar um agendamento por ID', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'apt-uuid', user_id: userId, client: {}, service: {}, payment: null });

    const result = await service.findOne(userId, 'apt-uuid');

    expect(result).toBeDefined();
  });

  it('deve lançar NotFoundException se agendamento não existir', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, 'inexistente')).rejects.toThrow(NotFoundException);
  });

  it('deve remover um agendamento', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'apt-uuid', user_id: userId, client: {}, service: {}, payment: null });
    mockPrisma.appointment.delete.mockResolvedValue({ id: 'apt-uuid' });

    const result = await service.remove(userId, 'apt-uuid');

    expect(mockPrisma.appointment.delete).toHaveBeenCalledWith({ where: { id: 'apt-uuid' } });
    expect(result).toEqual({ id: 'apt-uuid' });
  });
});
