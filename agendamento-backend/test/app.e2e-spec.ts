import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Agendamento API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let userSlug: string;
  let serviceId: string;
  let clientId: string;
  let appointmentId: string;

  const user = { nome: 'Teste E2E', email: `e2e_${Date.now()}@teste.com`, senha: '123456', telefone: '11999999999' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/auth/register - deve registrar e retornar slug', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user)
        .expect(201)
        .expect(res => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe(user.email);
          expect(res.body.slug).toBeDefined();
          userSlug = res.body.slug;
        });
    });

    it('POST /api/auth/register - deve rejeitar email duplicado', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user)
        .expect(409);
    });

    it('POST /api/auth/login - deve autenticar e retornar slug', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, senha: user.senha })
        .expect(200)
        .expect(res => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(user.email);
          expect(res.body.user.slug).toBeDefined();
          token = res.body.access_token;
        });
    });

    it('POST /api/auth/login - deve rejeitar senha inválida', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, senha: 'errada' })
        .expect(401);
    });
  });

  describe('Services (protegido)', () => {
    const newService = { nome: 'Maquiagem E2E', preco: 200, duracao_minutos: 90 };

    it('GET /api/services - sem token deve retornar 401', () => {
      return request(app.getHttpServer()).get('/api/services').expect(401);
    });

    it('POST /api/services - deve criar serviço', () => {
      return request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...newService, descricao: 'Teste', valor_sinal: 50 })
        .expect(201)
        .expect(res => {
          expect(res.body.id).toBeDefined();
          expect(res.body.nome).toBe('Maquiagem E2E');
          serviceId = res.body.id;
        });
    });

    it('GET /api/services - deve listar serviços', () => {
      return request(app.getHttpServer())
        .get('/api/services')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/services/:id - deve obter serviço', () => {
      return request(app.getHttpServer())
        .get(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(res => {
          expect(res.body.id).toBe(serviceId);
        });
    });

    it('PUT /api/services/:id - deve atualizar serviço', () => {
      return request(app.getHttpServer())
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Maquiagem Atualizada' })
        .expect(200)
        .expect(res => {
          expect(res.body.nome).toBe('Maquiagem Atualizada');
        });
    });
  });

  describe('Clients (protegido)', () => {
    it('POST /api/clients - deve criar cliente', () => {
      return request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Cliente E2E', telefone: '11988888888', email: 'cliente@teste.com' })
        .expect(201)
        .expect(res => {
          expect(res.body.id).toBeDefined();
          clientId = res.body.id;
        });
    });

    it('GET /api/clients - deve listar clientes', () => {
      return request(app.getHttpServer())
        .get('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('Appointments (protegido)', () => {
    it('POST /api/appointments - deve criar agendamento', () => {
      return request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({ client_id: clientId, service_id: serviceId, data: '2026-12-25', horario: '10:00' })
        .expect(201)
        .expect(res => {
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toBe('reservado');
          expect(res.body.valor_servico).toBe('200');
          expect(res.body.client).toBeDefined();
          expect(res.body.service).toBeDefined();
          appointmentId = res.body.id;
        });
    });

    it('POST /api/appointments - deve rejeitar horário duplicado', () => {
      return request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({ client_id: clientId, service_id: serviceId, data: '2026-12-25', horario: '10:00' })
        .expect(409);
    });

    it('GET /api/appointments - deve listar agendamentos', () => {
      return request(app.getHttpServer())
        .get('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('PUT /api/appointments/:id - deve atualizar status', () => {
      return request(app.getHttpServer())
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'confirmado' })
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe('confirmado');
        });
    });

    it('DELETE /api/appointments/:id - deve remover agendamento', () => {
      return request(app.getHttpServer())
        .delete(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('DELETE /api/services/:id - deve remover serviço', () => {
      return request(app.getHttpServer())
        .delete(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Público (sem auth)', () => {
    it('GET /api/public/:slug - pagina profissional', () => {
      return request(app.getHttpServer())
        .get(`/api/public/${userSlug}`)
        .expect(200)
        .expect(res => {
          expect(res.body.nome).toBe(user.nome);
          expect(res.body.email).toBe(user.email);
        });
    });

    it('GET /api/public/:slug - 404 para slug invalido', () => {
      return request(app.getHttpServer())
        .get('/api/public/slug-inexistente-123')
        .expect(404);
    });

    it('GET /api/public/:slug/services - lista servicos ativos', () => {
      return request(app.getHttpServer())
        .get(`/api/public/${userSlug}/services`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/public/:slug/slots - horarios disponiveis', () => {
      return request(app.getHttpServer())
        .get(`/api/public/${userSlug}/slots?data=2026-12-25`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /api/public/:slug/appointments - cria agendamento como cliente', async () => {
      const servicesRes = await request(app.getHttpServer())
        .get(`/api/public/${userSlug}/services`);
      
      expect(servicesRes.body.length).toBeGreaterThan(0);

      return request(app.getHttpServer())
        .post(`/api/public/${userSlug}/appointments`)
        .send({
          nome: 'Cliente Publico',
          telefone: '11977777777',
          service_id: servicesRes.body[0].id,
          data: '2026-12-25',
          horario: '14:00',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toBe('reservado');
        });
    });

    it('POST /api/public/:slug/appointments - rejeita horario ocupado', async () => {
      const servicesRes = await request(app.getHttpServer())
        .get(`/api/public/${userSlug}/services`);

      return request(app.getHttpServer())
        .post(`/api/public/${userSlug}/appointments`)
        .send({
          nome: 'Outro Cliente',
          telefone: '11966666666',
          service_id: servicesRes.body[0].id,
          data: '2026-12-25',
          horario: '14:00',
        })
        .expect(409);
    });
  });

  describe('Recuperacao de senha', () => {
    let resetToken: string;

    it('POST /api/auth/forgot-password - aceita email existente', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBeDefined();
          expect(res.body.token).toBeDefined();
          resetToken = res.body.token;
        });
    });

    it('POST /api/auth/reset-password - redefine senha com token valido', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: resetToken, senha: 'nova123456' })
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Senha alterada com sucesso.');
        });
    });

    it('POST /api/auth/login - nova senha funciona', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, senha: 'nova123456' })
        .expect(200)
        .expect(res => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('POST /api/auth/reset-password - rejeita token reutilizado', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: resetToken, senha: 'nova123456' })
        .expect(400);
    });
  });
});
