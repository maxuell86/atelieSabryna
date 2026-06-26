import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  generateSlots: jest.fn(),
};

describe('AvailabilityController', () => {
  let controller: AvailabilityController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [{ provide: AvailabilityService, useValue: mockService }],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
  });

  it('deve criar bloco', async () => {
    const user = { id: 'user-uuid' };
    const dto = { data: '2026-07-01', horario_inicio: '09:00', horario_fim: '12:00', duracao_minutos: 60 };
    mockService.create.mockResolvedValue({ id: 'block-uuid' });

    const result = await controller.create(user, dto);

    expect(mockService.create).toHaveBeenCalledWith(user.id, dto);
    expect(result).toEqual({ id: 'block-uuid' });
  });

  it('deve listar blocos', async () => {
    const user = { id: 'user-uuid' };
    mockService.findAll.mockResolvedValue([{ id: '1' }]);

    const result = await controller.findAll(user);

    expect(mockService.findAll).toHaveBeenCalledWith(user.id, undefined);
    expect(result).toHaveLength(1);
  });

  it('deve listar blocos filtrando por data', async () => {
    const user = { id: 'user-uuid' };
    await controller.findAll(user, '2026-07-01');

    expect(mockService.findAll).toHaveBeenCalledWith(user.id, '2026-07-01');
  });

  it('deve gerar slots', async () => {
    const user = { id: 'user-uuid' };
    mockService.generateSlots.mockResolvedValue(['09:00', '10:00']);

    const result = await controller.generateSlots(user, '2026-07-01');

    expect(mockService.generateSlots).toHaveBeenCalledWith(user.id, '2026-07-01');
    expect(result).toHaveLength(2);
  });

  it('deve buscar bloco por ID', async () => {
    const user = { id: 'user-uuid' };
    mockService.findOne.mockResolvedValue({ id: 'block-uuid' });

    const result = await controller.findOne(user, 'block-uuid');

    expect(mockService.findOne).toHaveBeenCalledWith(user.id, 'block-uuid');
  });

  it('deve atualizar bloco', async () => {
    const user = { id: 'user-uuid' };
    const dto = { data: '2026-07-01', horario_inicio: '10:00', horario_fim: '12:00', duracao_minutos: 30 };
    mockService.update.mockResolvedValue({ id: 'block-uuid' });

    const result = await controller.update(user, 'block-uuid', dto);

    expect(mockService.update).toHaveBeenCalledWith(user.id, 'block-uuid', dto);
  });

  it('deve remover bloco', async () => {
    const user = { id: 'user-uuid' };
    mockService.remove.mockResolvedValue({ id: 'block-uuid' });

    const result = await controller.remove(user, 'block-uuid');

    expect(mockService.remove).toHaveBeenCalledWith(user.id, 'block-uuid');
  });
});
