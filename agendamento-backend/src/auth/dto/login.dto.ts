import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'O email introduzido não é válido.' })
  email!: string;

  @IsString()
  @MinLength(6, {
    message: 'A palavra-passe deve ter pelo menos 6 caracteres.',
  })
  senha!: string;
}
