import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({
    example: 'john@example.com',
  })
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    example: 'John',
    maxLength: 50,
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    maxLength: 50,
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  lastName?: string;
}
