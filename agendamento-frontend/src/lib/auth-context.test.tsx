import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './auth-context';
import { api } from './api';

jest.mock('./api', () => ({
  api: {
    setToken: jest.fn(),
    getToken: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.nome : 'null'}</span>
      <span data-testid="isLoading">{auth.isLoading ? 'true' : 'false'}</span>
      <span data-testid="token">{auth.token || 'null'}</span>
      <button data-testid="login" onClick={() => auth.login('email@test.com', '123456')}>
        Login
      </button>
      <button data-testid="logout" onClick={() => auth.logout()}>
        Logout
      </button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  document.cookie = '';
  mockApi.getToken.mockReturnValue(null);
});

describe('AuthProvider', () => {
  it('deve iniciar sem usuário e isLoading=false após carregar', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
  });

  it('deve fazer login e atualizar estado', async () => {
    const loginResponse = {
      access_token: 'jwt-token',
      user: { id: '1', nome: 'Maria', email: 'maria@test.com', slug: 'maria' },
    };
    mockApi.post.mockResolvedValue(loginResponse);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByTestId('login'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Maria');
    });
    expect(screen.getByTestId('token')).toHaveTextContent('jwt-token');
    expect(mockApi.setToken).toHaveBeenCalledWith('jwt-token');
  });

  it('deve fazer logout e limpar estado', async () => {
    mockApi.post.mockResolvedValue({
      access_token: 'jwt-token',
      user: { id: '1', nome: 'Maria', email: 'maria@test.com', slug: 'maria' },
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByTestId('login'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Maria');
    });

    await userEvent.click(screen.getByTestId('logout'));

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
  });
});

describe('useAuth sem provider', () => {
  it('deve lançar erro se usado fora do AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useAuth deve ser usado dentro de AuthProvider');
    consoleError.mockRestore();
  });
});
