/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// Simular o módulo de middleware
function createMiddlewareResponse(request: NextRequest): { status: number; location?: string } {
  const { pathname } = new URL(request.url);
  const token = request.cookies.get('token')?.value || request.headers.get('Authorization') || '';

  if (pathname.startsWith('/dashboard') && !token) {
    return { status: 307, location: '/login' };
  }

  if ((pathname === '/login' || pathname === '/register') && token) {
    return { status: 307, location: '/dashboard' };
  }

  return { status: 200 };
}

function createRequest(url: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', token);
  }
  return {
    url,
    headers,
    cookies: {
      get: (name: string) => token ? { value: token, name } : undefined,
    },
    nextUrl: { pathname: new URL(url).pathname },
  } as unknown as NextRequest;
}

describe('Middleware', () => {
  describe('proteção de rotas', () => {
    it('deve redirecionar para /login se acessar /dashboard sem token', () => {
      const req = createRequest('http://localhost:3000/dashboard');
      const res = createMiddlewareResponse(req);

      expect(res.status).toBe(307);
      expect(res.location).toBe('/login');
    });

    it('deve permitir acesso a /dashboard com token', () => {
      const req = createRequest('http://localhost:3000/dashboard', 'Bearer jwt-token');
      const res = createMiddlewareResponse(req);

      expect(res.status).toBe(200);
    });

    it('deve redirecionar para /dashboard se acessar /login estando logado', () => {
      const req = createRequest('http://localhost:3000/login', 'Bearer jwt-token');
      const res = createMiddlewareResponse(req);

      expect(res.status).toBe(307);
      expect(res.location).toBe('/dashboard');
    });

    it('deve redirecionar para /dashboard se acessar /register estando logado', () => {
      const req = createRequest('http://localhost:3000/register', 'Bearer jwt-token');
      const res = createMiddlewareResponse(req);

      expect(res.status).toBe(307);
      expect(res.location).toBe('/dashboard');
    });

    it('deve permitir acesso a /login sem token', () => {
      const req = createRequest('http://localhost:3000/login');
      const res = createMiddlewareResponse(req);

      expect(res.status).toBe(200);
    });

    it('deve permitir rotas públicas sem token', () => {
      const req = createRequest('http://localhost:3000/agende/maria');
      const res = createMiddlewareResponse(req);

      expect(res.status).toBe(200);
    });
  });
});
