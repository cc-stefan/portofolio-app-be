import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function normalizeEmail({ value }: TransformFnParams): unknown {
  const input = value as unknown;

  if (typeof input !== 'string') {
    return input;
  }

  return input.trim().toLowerCase();
}

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
  })
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
