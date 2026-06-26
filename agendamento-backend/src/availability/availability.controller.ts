import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Disponibilidade')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um bloco de disponibilidade' })
  @ApiResponse({ status: 201, description: 'Bloco criado com sucesso.' })
  create(@CurrentUser() user: any, @Body() dto: CreateAvailabilityDto) {
    return this.availabilityService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar blocos de disponibilidade' })
  @ApiQuery({ name: 'data', required: false, example: '2026-07-01' })
  findAll(@CurrentUser() user: any, @Query('data') data?: string) {
    return this.availabilityService.findAll(user.id, data);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Gerar slots disponíveis para uma data' })
  @ApiQuery({ name: 'data', required: true, example: '2026-07-01' })
  generateSlots(@CurrentUser() user: any, @Query('data') data: string) {
    return this.availabilityService.generateSlots(user.id, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um bloco pelo ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.availabilityService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um bloco de disponibilidade' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateAvailabilityDto) {
    return this.availabilityService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um bloco de disponibilidade' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.availabilityService.remove(user.id, id);
  }
}
