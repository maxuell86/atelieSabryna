import { api } from './api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  api.setToken(null);
});

describe('ApiClient', () => {
  describe('setToken / getToken', () => {
    it('deve salvar token no localStorage', () => {
      api.setToken('my-token');
      expect(localStorage.getItem('token')).toBe('my-token');
      expect(api.getToken()).toBe('my-token');
    });

    it('deve remover token ao passar null', () => {
      api.setToken('my-token');
      api.setToken(null);
      expect(localStorage.getItem('token')).toBeNull();
      expect(api.getToken()).toBeNull();
    });
  });

  describe('GET', () => {
    it('deve fazer requisição GET', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }]),
      });

      const data = await api.get('/services');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3333/api/services',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(data).toEqual([{ id: 1 }]);
    });

    it('deve incluir token no header Authorization', async () => {
      api.setToken('jwt-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await api.get('/services');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
        }),
      );
    });
  });

  describe('POST', () => {
    it('deve fazer requisição POST com body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'new' }),
      });

      const body = { nome: 'Maria' };
      const data = await api.post('/clients', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3333/api/clients',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
      expect(data).toEqual({ id: 'new' });
    });
  });

  describe('PUT', () => {
    it('deve fazer requisição PUT', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'updated' }),
      });

      const data = await api.put('/clients/1', { nome: 'Atualizado' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3333/api/clients/1',
        expect.objectContaining({ method: 'PUT' }),
      );
      expect(data).toEqual({ id: 'updated' });
    });
  });

  describe('DELETE', () => {
    it('deve fazer requisição DELETE', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'deleted' }),
      });

      const data = await api.delete('/clients/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3333/api/clients/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(data).toEqual({ id: 'deleted' });
    });
  });

  describe('uploadFile', () => {
    it('deve fazer upload com FormData', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: '/uploads/test.png' }),
      });

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const data = await api.uploadFile('/theme/upload', file);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3333/api/theme/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }),
      );
      expect(data).toEqual({ url: '/uploads/test.png' });
    });
  });

  describe('error handling', () => {
    it('deve lançar ApiError com status 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Não autorizado', statusCode: 401 }),
      });

      await expect(api.get('/services')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Não autorizado',
      });
    });

    it('deve lançar erro genérico se resposta não for JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(api.get('/services')).rejects.toMatchObject({
        statusCode: 500,
        message: 'Erro desconhecido',
      });
    });
  });
});
