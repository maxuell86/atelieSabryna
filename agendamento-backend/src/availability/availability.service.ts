import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAvailabilityDto) {
    return this.prisma.availabilityBlock.create({
      data: {
        user_id: userId,
        data: new Date(dto.data),
        horario_inicio: dto.horario_inicio,
        horario_fim: dto.horario_fim,
        duracao_minutos: dto.duracao_minutos,
      },
    });
  }

  async findAll(userId: string, data?: string) {
    const where: any = { user_id: userId };
    if (data) {
      where.data = new Date(data);
    }
    return this.prisma.availabilityBlock.findMany({
      where,
      orderBy: [{ data: 'asc' }, { horario_inicio: 'asc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const block = await this.prisma.availabilityBlock.findFirst({
      where: { id, user_id: userId },
    });
    if (!block) {
      throw new NotFoundException('Bloco de disponibilidade não encontrado.');
    }
    return block;
  }

  async update(userId: string, id: string, dto: Partial<CreateAvailabilityDto>) {
    await this.findOne(userId, id);
    const data: any = { ...dto };
    if (dto.data) {
      data.data = new Date(dto.data);
    }
    return this.prisma.availabilityBlock.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.availabilityBlock.delete({ where: { id } });
  }

  async generateSlots(userId: string, data: string) {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: { user_id: userId, data: new Date(data) },
      orderBy: { horario_inicio: 'asc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        user_id: userId,
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
