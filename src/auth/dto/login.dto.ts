import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  const input = value as unknown;

  if (typeof input !== 'string') {
    return input;
  }

  return input.trim().toLowerCase();
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
