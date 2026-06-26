import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ServicesController', () => {
  let controller: ServicesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: mockService }],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  const user = { id: 'user-uuid' };
  const dto = { nome: 'Maquiagem', preco: 150, duracao_minutos: 60 };

  it('deve criar serviço', async () => {
    mockService.create.mockResolvedValue({ id: 'svc-uuid' });

    const result = await controller.create(user, dto);

    expect(mockService.create).toHaveBeenCalledWith(user.id, dto);
    expect(result).toEqual({ id: 'svc-uuid' });
  });

  it('deve listar serviços', async () => {
    mockService.findAll.mockResolvedValue([{ id: '1' }]);

    const result = await controller.findAll(user);

    expect(mockService.findAll).toHaveBeenCalledWith(user.id);
    expect(result).toHaveLength(1);
  });

  it('deve buscar serviço por ID', async () => {
    mockService.findOne.mockResolvedValue({ id: 'svc-uuid' });

    const result = await controller.findOne(user, 'svc-uuid');

    expect(mockService.findOne).toHaveBeenCalledWith(user.id, 'svc-uuid');
  });

  it('deve atualizar serviço', async () => {
    const updateDto = { nome: 'Atualizado' };
    mockService.update.mockResolvedValue({ id: 'svc-uuid', nome: 'Atualizado' });

    const result = await controller.update(user, 'svc-uuid', updateDto);

    expect(mockService.update).toHaveBeenCalledWith(user.id, 'svc-uuid', updateDto);
    expect(result.nome).toBe('Atualizado');
  });

  it('deve remover serviço', async () => {
    mockService.remove.mockResolvedValue({ id: 'svc-uuid' });

    const result = await controller.remove(user, 'svc-uuid');

    expect(mockService.remove).toHaveBeenCalledWith(user.id, 'svc-uuid');
  });
});
