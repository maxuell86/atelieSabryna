import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PublicService } from './public.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  service: { findMany: jest.fn(), findFirst: jest.fn() },
  client: { findFirst: jest.fn(), create: jest.fn() },
  appointment: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  availabilityBlock: { findMany: jest.fn() },
};

describe('PublicService', () => {
  let service: PublicService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PublicService>(PublicService);
  });

  const slug = 'maria-abc12';
  const userId = 'user-uuid';

  describe('getProfessional', () => {
    it('deve retornar dados do profissional com tema', async () => {
      const user = { id: userId, nome: 'Maria', email: 'maria@email.com', telefone: '11999999999', theme: { primary_color: '#ff0000' } };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfessional(slug);

      expect(result.nome).toBe('Maria');
      expect(result.theme).toBeDefined();
    });

    it('deve retornar profissional sem tema se não houver', async () => {
      const user = { id: userId, nome: 'Maria', email: 'maria@email.com', telefone: '11999999999', theme: null };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfessional(slug);

      expect(result.theme).toBeUndefined();
    });

    it('deve lançar NotFoundException se slug não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfessional('invalido')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getServices', () => {
    it('deve listar serviços ativos', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.service.findMany.mockResolvedValue([{ id: 'svc-uuid', nome: 'Maquiagem' }]);

      const result = await service.getServices(slug);

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: { user_id: userId, ativo: true },
        select: { id: true, nome: true, descricao: true, preco: true, valor_sinal: true, foto_url: true },
        orderBy: { nome: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('deve lançar NotFoundException se profissional não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getServices('invalido')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableSlots', () => {
    it('deve retornar slots disponíveis', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.availabilityBlock.findMany.mockResolvedValue([
        { horario_inicio: '09:00', horario_fim: '11:00', duracao_minutos: 60 },
      ]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const slots = await service.getAvailableSlots(slug, '2026-07-01');

      expect(slots).toEqual(['09:00', '10:00']);
    });

    it('deve lançar NotFoundException se profissional não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getAvailableSlots('invalido', '2026-07-01')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAppointment', () => {
    const dto = { nome: 'Cliente', telefone: '11977777777', service_id: 'svc-uuid', data: '2026-07-01', horario: '14:00' };

    it('deve criar agendamento como cliente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.service.findFirst.mockResolvedValue({ id: 'svc-uuid', preco: 150, valor_sinal: 50 });
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.client.findFirst.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue({ id: 'cli-uuid', nome: 'Cliente', telefone: '11977777777' });
      mockPrisma.appointment.create.mockResolvedValue({
        id: 'apt-uuid', status: 'reservado', service: { nome: 'Maquiagem', preco: 150 },
      });

      const result = await service.createAppointment(slug, dto);

      expect(result.status).toBe('reservado');
      expect(mockPrisma.client.create).toHaveBeenCalled();
    });

    it('deve reutilizar cliente existente pelo telefone', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.service.findFirst.mockResolvedValue({ id: 'svc-uuid', preco: 150, valor_sinal: 50 });
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'cli-existente' });
      mockPrisma.appointment.create.mockResolvedValue({
        id: 'apt-uuid', status: 'reservado', service: { nome: 'Maquiagem', preco: 150 },
      });

      await service.createAppointment(slug, dto);

      expect(mockPrisma.client.create).not.toHaveBeenCalled();
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ client_id: 'cli-existente' }),
        }),
      );
    });

    it('deve lançar ConflictException se horário estiver ocupado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.service.findFirst.mockResolvedValue({ id: 'svc-uuid', preco: 150, valor_sinal: 50 });
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.createAppointment(slug, dto)).rejects.toThrow(ConflictException);
    });

    it('deve lançar NotFoundException se profissional não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createAppointment('invalido', dto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se serviço não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.service.findFirst.mockResolvedValue(null);

      await expect(service.createAppointment(slug, dto)).rejects.toThrow(NotFoundException);
    });
  });
});
