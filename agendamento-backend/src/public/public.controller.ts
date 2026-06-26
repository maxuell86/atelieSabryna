import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';

@ApiTags('Público')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Obter dados públicos da profissional' })
  getProfessional(@Param('slug') slug: string) {
    return this.publicService.getProfessional(slug);
  }

  @Get(':slug/services')
  @ApiOperation({ summary: 'Listar serviços ativos da profissional' })
  getServices(@Param('slug') slug: string) {
    return this.publicService.getServices(slug);
  }

  @Get(':slug/slots')
  @ApiOperation({ summary: 'Obter horários disponíveis para uma data' })
  getSlots(@Param('slug') slug: string, @Query('data') data: string) {
    return this.publicService.getAvailableSlots(slug, data);
  }

  @Post(':slug/appointments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar agendamento como cliente (sem cadastro)' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Horário já reservado.' })
  createAppointment(@Param('slug') slug: string, @Body() dto: CreatePublicAppointmentDto) {
    return this.publicService.createAppointment(slug, dto);
  }
}
