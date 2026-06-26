import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve ter método onModuleInit', () => {
    expect(typeof service.onModuleInit).toBe('function');
  });

  it('deve ter método onModuleDestroy', () => {
    expect(typeof service.onModuleDestroy).toBe('function');
  });
});
