import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsEmail({}, { message: 'O email introduzido não é válido.' })
  email!: string;

  @IsString()
  @MinLength(6, {
    message: 'A palavra-passe deve ter pelo menos 6 caracteres.',
  })
  senha!: string;

  @IsString()
  @IsNotEmpty()
  telefone!: string;
}
