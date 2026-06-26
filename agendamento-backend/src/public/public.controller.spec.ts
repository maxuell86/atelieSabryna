import { Test, TestingModule } from '@nestjs/testing';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

const mockService = {
  getProfessional: jest.fn(),
  getServices: jest.fn(),
  getAvailableSlots: jest.fn(),
  createAppointment: jest.fn(),
};

describe('PublicController', () => {
  let controller: PublicController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [{ provide: PublicService, useValue: mockService }],
    }).compile();

    controller = module.get<PublicController>(PublicController);
  });

  it('deve obter dados do profissional', async () => {
    mockService.getProfessional.mockResolvedValue({ nome: 'Maria' });

    const result = await controller.getProfessional('maria-abc12');

    expect(mockService.getProfessional).toHaveBeenCalledWith('maria-abc12');
    expect(result.nome).toBe('Maria');
  });

  it('deve listar serviços públicos', async () => {
    mockService.getServices.mockResolvedValue([{ id: 'svc-uuid' }]);

    const result = await controller.getServices('maria-abc12');

    expect(mockService.getServices).toHaveBeenCalledWith('maria-abc12');
    expect(result).toHaveLength(1);
  });

  it('deve obter slots disponíveis', async () => {
    mockService.getAvailableSlots.mockResolvedValue(['09:00', '10:00']);

    const result = await controller.getSlots('maria-abc12', '2026-07-01');

    expect(mockService.getAvailableSlots).toHaveBeenCalledWith('maria-abc12', '2026-07-01');
    expect(result).toEqual(['09:00', '10:00']);
  });

  it('deve criar agendamento público', async () => {
    const dto = { nome: 'Cliente', telefone: '11977777777', service_id: 'svc-uuid', data: '2026-07-01', horario: '14:00' };
    mockService.createAppointment.mockResolvedValue({ id: 'apt-uuid' });

    const result = await controller.createAppointment('maria-abc12', dto);

    expect(mockService.createAppointment).toHaveBeenCalledWith('maria-abc12', dto);
    expect(result).toEqual({ id: 'apt-uuid' });
  });
});
