import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function trimString({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

export class CreateInquiryDto {
  @ApiProperty({
    example: 'Jane Doe',
    minLength: 2,
    maxLength: 120,
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'jane@example.com',
    maxLength: 320,
  })
  @Transform(trimString)
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({
    example:
      'I would like to discuss a backend-focused role and a potential contract engagement.',
    minLength: 24,
    maxLength: 5000,
  })
  @Transform(trimString)
  @IsString()
  @MinLength(24)
  @MaxLength(5000)
  message: string;
}
