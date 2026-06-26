import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-do-cliente' })
  @IsString()
  @IsNotEmpty()
  client_id!: string;

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

  @ApiProperty({ example: 150.00, required: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  valor_servico?: number;

  @ApiProperty({ example: 50.00, required: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  valor_sinal?: number;
}
