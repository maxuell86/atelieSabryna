import { IsString, IsInt, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty({ example: '2026-07-01', description: 'Data do atendimento' })
  @IsString()
  data: string;

  @ApiProperty({ example: '09:00', description: 'Horário de início (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horario_inicio deve estar no formato HH:MM' })
  horario_inicio: string;

  @ApiProperty({ example: '12:00', description: 'Horário de fim (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horario_fim deve estar no formato HH:MM' })
  horario_fim: string;

  @ApiProperty({ example: 30, description: 'Duração de cada slot em minutos' })
  @IsInt()
  @Min(1)
  duracao_minutos: number;
}
