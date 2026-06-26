import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('deve chamar register do service', async () => {
    const dto = { nome: 'Maria', email: 'maria@email.com', senha: '123456', telefone: '11999999999' };
    mockAuthService.register.mockResolvedValue({ id: 'uuid', nome: 'Maria' });

    const result = await controller.register(dto);

    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'uuid', nome: 'Maria' });
  });

  it('deve chamar login do service', async () => {
    const dto = { email: 'maria@email.com', senha: '123456' };
    mockAuthService.login.mockResolvedValue({ access_token: 'jwt' });

    const result = await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result.access_token).toBe('jwt');
  });

  it('deve chamar forgotPassword do service', async () => {
    const dto = { email: 'maria@email.com' };
    mockAuthService.forgotPassword.mockResolvedValue({ message: 'ok' });

    const result = await controller.forgotPassword(dto);

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
    expect(result.message).toBe('ok');
  });

  it('deve chamar resetPassword do service', async () => {
    const dto = { token: 'abc', senha: 'nova123' };
    mockAuthService.resetPassword.mockResolvedValue({ message: 'Senha alterada com sucesso.' });

    const result = await controller.resetPassword(dto);

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
    expect(result.message).toBe('Senha alterada com sucesso.');
  });
});
