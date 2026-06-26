import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: mockService }],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  const user = { id: 'user-uuid' };
  const dto = { client_id: 'cli-uuid', service_id: 'svc-uuid', data: '2026-07-01', horario: '14:30' };

  it('deve criar agendamento', async () => {
    mockService.create.mockResolvedValue({ id: 'apt-uuid' });

    const result = await controller.create(user, dto);

    expect(mockService.create).toHaveBeenCalledWith(user.id, dto);
    expect(result).toEqual({ id: 'apt-uuid' });
  });

  it('deve listar agendamentos', async () => {
    mockService.findAll.mockResolvedValue([{ id: '1' }]);

    const result = await controller.findAll(user);

    expect(mockService.findAll).toHaveBeenCalledWith(user.id, undefined);
    expect(result).toHaveLength(1);
  });

  it('deve listar agendamentos filtrando por data', async () => {
    mockService.findAll.mockResolvedValue([]);

    await controller.findAll(user, '2026-07-01');

    expect(mockService.findAll).toHaveBeenCalledWith(user.id, '2026-07-01');
  });

  it('deve buscar agendamento por ID', async () => {
    mockService.findOne.mockResolvedValue({ id: 'apt-uuid' });

    const result = await controller.findOne(user, 'apt-uuid');

    expect(mockService.findOne).toHaveBeenCalledWith(user.id, 'apt-uuid');
  });

  it('deve atualizar agendamento', async () => {
    const updateDto = { status: 'confirmado' };
    mockService.update.mockResolvedValue({ id: 'apt-uuid', status: 'confirmado' });

    const result = await controller.update(user, 'apt-uuid', updateDto);

    expect(mockService.update).toHaveBeenCalledWith(user.id, 'apt-uuid', updateDto);
    expect(result.status).toBe('confirmado');
  });

  it('deve remover agendamento', async () => {
    mockService.remove.mockResolvedValue({ id: 'apt-uuid' });

    const result = await controller.remove(user, 'apt-uuid');

    expect(mockService.remove).toHaveBeenCalledWith(user.id, 'apt-uuid');
  });
});
