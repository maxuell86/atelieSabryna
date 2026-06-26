import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        user_id: userId,
        nome: dto.nome,
        descricao: dto.descricao,
        preco: dto.preco,
        valor_sinal: dto.valor_sinal ?? 0,
        foto_url: dto.foto_url,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.service.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, user_id: userId },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    return service;
  }

  async update(userId: string, id: string, dto: UpdateServiceDto) {
    await this.findOne(userId, id);

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
