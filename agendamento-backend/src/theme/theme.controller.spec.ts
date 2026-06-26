import { Test, TestingModule } from '@nestjs/testing';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';

const mockService = {
  getTheme: jest.fn(),
  updateTheme: jest.fn(),
};

describe('ThemeController', () => {
  let controller: ThemeController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThemeController],
      providers: [{ provide: ThemeService, useValue: mockService }],
    }).compile();

    controller = module.get<ThemeController>(ThemeController);
  });

  it('deve obter tema', async () => {
    const user = { id: 'user-uuid' };
    mockService.getTheme.mockResolvedValue({ primary_color: '#ff0000' });

    const result = await controller.getTheme(user);

    expect(mockService.getTheme).toHaveBeenCalledWith(user.id);
    expect(result).toEqual({ primary_color: '#ff0000' });
  });

  it('deve atualizar tema', async () => {
    const user = { id: 'user-uuid' };
    const dto = { primary_color: '#00ff00' };
    mockService.updateTheme.mockResolvedValue({ primary_color: '#00ff00' });

    const result = await controller.updateTheme(user, dto);

    expect(mockService.updateTheme).toHaveBeenCalledWith(user.id, dto);
    expect(result.primary_color).toBe('#00ff00');
  });
});
