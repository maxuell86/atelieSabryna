import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new ConflictException('Este email já está sendo utilizado.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedOptions = await bcrypt.hash(dto.senha, salt);

    const slugBase = dto.nome
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const random = Math.random().toString(36).substring(2, 6);
    const slug = `${slugBase}-${random}`;

    const user = await this.prisma.user.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        slug,
        senha: hashedOptions,
        telefone: dto.telefone,
      },
    });

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      slug: user.slug,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.senha, user.senha);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = { sub: user.id, email: user.email };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        slug: user.slug,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      return { message: 'Se o email existir, você receberá um link de recuperação.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { reset_token: token, reset_expires: expires },
    });

    // Em produção: enviar email com link contendo o token
    // Link: http://localhost:3000/reset-password?token=${token}

    return {
      message: 'Se o email existir, você receberá um link de recuperação.',
      ...(process.env.NODE_ENV !== 'production' && { token }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        reset_token: dto.token,
        reset_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const salt = await bcrypt.genSalt(10);
    const senha = await bcrypt.hash(dto.senha, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { senha, reset_token: null, reset_expires: null },
    });

    return { message: 'Senha alterada com sucesso.' };
  }
}