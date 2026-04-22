import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  const input = value as unknown;

  if (typeof input !== 'string') {
    return input;
  }

  return input.trim().toLowerCase();
}

function trimString({ value }: TransformFnParams): unknown {
  const input = value as unknown;

  if (typeof input !== 'string') {
    return input;
  }

  return input.trim();
}

export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  lastName?: string;
}
