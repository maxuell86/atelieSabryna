import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockService }],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
  });

  const user = { id: 'user-uuid' };
  const dto = { nome: 'Maria', telefone: '11999999999', email: 'maria@email.com' };

  it('deve criar cliente', async () => {
    mockService.create.mockResolvedValue({ id: 'cli-uuid' });

    const result = await controller.create(user, dto);

    expect(mockService.create).toHaveBeenCalledWith(user.id, dto);
    expect(result).toEqual({ id: 'cli-uuid' });
  });

  it('deve listar clientes', async () => {
    mockService.findAll.mockResolvedValue([{ id: '1' }]);

    const result = await controller.findAll(user);

    expect(mockService.findAll).toHaveBeenCalledWith(user.id);
    expect(result).toHaveLength(1);
  });

  it('deve buscar cliente por ID', async () => {
    mockService.findOne.mockResolvedValue({ id: 'cli-uuid' });

    const result = await controller.findOne(user, 'cli-uuid');

    expect(mockService.findOne).toHaveBeenCalledWith(user.id, 'cli-uuid');
  });

  it('deve atualizar cliente', async () => {
    const updateDto = { nome: 'Atualizado' };
    mockService.update.mockResolvedValue({ id: 'cli-uuid', nome: 'Atualizado' });

    const result = await controller.update(user, 'cli-uuid', updateDto);

    expect(mockService.update).toHaveBeenCalledWith(user.id, 'cli-uuid', updateDto);
    expect(result.nome).toBe('Atualizado');
  });

  it('deve remover cliente', async () => {
    mockService.remove.mockResolvedValue({ id: 'cli-uuid' });

    const result = await controller.remove(user, 'cli-uuid');

    expect(mockService.remove).toHaveBeenCalledWith(user.id, 'cli-uuid');
  });
});
