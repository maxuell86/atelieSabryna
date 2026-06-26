import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async getTheme(userId: string) {
    let theme = await this.prisma.professionalTheme.findUnique({
      where: { user_id: userId },
    });

    if (!theme) {
      theme = await this.prisma.professionalTheme.create({
        data: { user_id: userId },
      });
    }

    return theme;
  }

  async updateTheme(userId: string, dto: UpdateThemeDto) {
    const existing = await this.prisma.professionalTheme.findUnique({
      where: { user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException('Tema não encontrado. Acesse a página de aparência para criar um.');
    }

    return this.prisma.professionalTheme.update({
      where: { user_id: userId },
      data: dto,
    });
  }
}
