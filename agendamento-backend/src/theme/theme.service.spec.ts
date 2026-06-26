import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  professionalTheme: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThemeService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ThemeService>(ThemeService);
  });

  const userId = 'user-uuid';

  describe('getTheme', () => {
    it('deve retornar o tema existente', async () => {
      const theme = { user_id: userId, primary_color: '#ff0000' };
      mockPrisma.professionalTheme.findUnique.mockResolvedValue(theme);

      const result = await service.getTheme(userId);

      expect(result).toEqual(theme);
      expect(mockPrisma.professionalTheme.create).not.toHaveBeenCalled();
    });

    it('deve criar tema padrão se não existir', async () => {
      mockPrisma.professionalTheme.findUnique.mockResolvedValue(null);
      const defaultTheme = { user_id: userId, primary_color: null };
      mockPrisma.professionalTheme.create.mockResolvedValue(defaultTheme);

      const result = await service.getTheme(userId);

      expect(mockPrisma.professionalTheme.create).toHaveBeenCalledWith({
        data: { user_id: userId },
      });
      expect(result).toEqual(defaultTheme);
    });
  });

  describe('updateTheme', () => {
    it('deve atualizar o tema', async () => {
      mockPrisma.professionalTheme.findUnique.mockResolvedValue({ user_id: userId });
      const updated = { user_id: userId, primary_color: '#00ff00' };
      mockPrisma.professionalTheme.update.mockResolvedValue(updated);

      const result = await service.updateTheme(userId, { primary_color: '#00ff00' });

      expect(mockPrisma.professionalTheme.update).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { primary_color: '#00ff00' },
      });
      expect(result.primary_color).toBe('#00ff00');
    });

    it('deve lançar NotFoundException se tema não existir', async () => {
      mockPrisma.professionalTheme.findUnique.mockResolvedValue(null);

      await expect(service.updateTheme(userId, { primary_color: '#00ff00' })).rejects.toThrow(NotFoundException);
    });
  });
});
