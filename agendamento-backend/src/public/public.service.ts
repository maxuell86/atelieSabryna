import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getProfessional(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, nome: true, email: true, telefone: true },
    });

    if (!user) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    return user;
  }

  async getServices(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    return this.prisma.service.findMany({
      where: { user_id: user.id, ativo: true },
      select: { id: true, nome: true, descricao: true, preco: true, foto_url: true },
      orderBy: { nome: 'asc' },
    });
  }

  async createAppointment(slug: string, dto: { nome: string; telefone: string; service_id: string; data: string; horario: string }) {
    const user = await this.prisma.user.findUnique({ where: { slug } });

    if (!user) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.service_id, user_id: user.id, ativo: true },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    const existing = await this.prisma.appointment.findFirst({
      where: {
        user_id: user.id,
        data: new Date(dto.data),
        horario: dto.horario,
        status: { in: ['reservado', 'confirmado'] },
      },
    });

    if (existing) {
      throw new ConflictException('Este horário já está reservado.');
    }

    let client = await this.prisma.client.findFirst({
      where: { user_id: user.id, telefone: dto.telefone },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: { user_id: user.id, nome: dto.nome, telefone: dto.telefone },
      });
    }

    return this.prisma.appointment.create({
      data: {
        user_id: user.id,
        client_id: client.id,
        service_id: service.id,
        data: new Date(dto.data),
        horario: dto.horario,
        valor_servico: service.preco,
        valor_sinal: service.valor_sinal,
        status: 'reservado',
      },
      include: {
        service: { select: { nome: true, preco: true } },
      },
    });
  }

  async getAvailableSlots(slug: string, data: string) {
    const user = await this.prisma.user.findUnique({ where: { slug } });

    if (!user) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    const blocks = await this.prisma.availabilityBlock.findMany({
      where: { user_id: user.id, data: new Date(data) },
      orderBy: { horario_inicio: 'asc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        user_id: user.id,
        data: new Date(data),
        status: { in: ['reservado', 'confirmado'] },
      },
      select: { horario: true },
    });

    const busyTimes = new Set(appointments.map(a => a.horario));

    const slots: string[] = [];
    for (const block of blocks) {
      const [hInicio, mInicio] = block.horario_inicio.split(':').map(Number);
      const [hFim, mFim] = block.horario_fim.split(':').map(Number);
      const startMin = hInicio * 60 + mInicio;
      const endMin = hFim * 60 + mFim;

      for (let min = startMin; min + block.duracao_minutos <= endMin; min += block.duracao_minutos) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (!busyTimes.has(slot)) {
          slots.push(slot);
        }
      }
    }

    return slots;
  }
}
