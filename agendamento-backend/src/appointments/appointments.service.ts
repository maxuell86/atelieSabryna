import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.service_id, user_id: userId },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    const client = await this.prisma.client.findFirst({
      where: { id: dto.client_id, user_id: userId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const existing = await this.prisma.appointment.findFirst({
      where: {
        user_id: userId,
        data: new Date(dto.data),
        horario: dto.horario,
        status: { in: ['reservado', 'confirmado'] },
      },
    });

    if (existing) {
      throw new ConflictException('Já existe um agendamento neste horário.');
    }

    return this.prisma.appointment.create({
      data: {
        user_id: userId,
        client_id: dto.client_id,
        service_id: dto.service_id,
        data: new Date(dto.data),
        horario: dto.horario,
        valor_servico: dto.valor_servico ?? service.preco,
        valor_sinal: dto.valor_sinal ?? service.valor_sinal,
      },
      include: { client: true, service: true },
    });
  }

  async findAll(userId: string, data?: string) {
    const where: any = { user_id: userId };

    if (data) {
      where.data = new Date(data);
    }

    return this.prisma.appointment.findMany({
      where,
      include: { client: true, service: true },
      orderBy: [{ data: 'asc' }, { horario: 'asc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, user_id: userId },
      include: { client: true, service: true, payment: true },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return appointment;
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    await this.findOne(userId, id);

    const data: any = { ...dto };

    if (dto.data) {
      data.data = new Date(dto.data);
    }

    if (dto.status) {
      data.status = dto.status;
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: { client: true, service: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.appointment.delete({
      where: { id },
    });
  }
}
