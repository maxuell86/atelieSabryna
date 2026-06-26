import { IsString, IsOptional, IsHexColor, IsIn, MaxLength } from 'class-validator';

export class UpdateThemeDto {
  @IsOptional()
  @IsHexColor()
  @MaxLength(7)
  primary_color?: string;

  @IsOptional()
  @IsString()
  @IsIn(['color', 'gradient', 'image'])
  background_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  background_value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  background_image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  font_family?: string;
}
