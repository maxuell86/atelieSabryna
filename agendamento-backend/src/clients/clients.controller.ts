import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.' })
  create(@CurrentUser() user: any, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  findAll(@CurrentUser() user: any) {
    return this.clientsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um cliente pelo ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um cliente' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um cliente' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clientsService.remove(user.id, id);
  }
}
