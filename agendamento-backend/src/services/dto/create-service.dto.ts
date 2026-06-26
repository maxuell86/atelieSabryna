import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Maquiagem Social' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: 'Maquiagem completa para eventos', required: false })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco!: number;

  @ApiProperty({ example: 50.00, required: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  valor_sinal?: number;

  @ApiProperty({ example: 'https://exemplo.com/foto.jpg', required: false })
  @IsString()
  @IsOptional()
  foto_url?: string;
}
