import { IsString, IsNotEmpty, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePublicAppointmentDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty()
  telefone!: string;

  @ApiProperty({ example: 'uuid-do-servico' })
  @IsString()
  @IsNotEmpty()
  service_id!: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  data!: string;

  @ApiProperty({ example: '14:30' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Horário deve estar no formato HH:MM' })
  horario!: string;
}
