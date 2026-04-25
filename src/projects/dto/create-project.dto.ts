import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  normalizeOptionalProjectText,
  normalizeProjectSlug,
  normalizeProjectStringArray,
  normalizeProjectText,
} from '../projects.utils';

function trimProjectText({ value }: TransformFnParams): unknown {
  return normalizeProjectText(value);
}

function trimOptionalProjectText({ value }: TransformFnParams): unknown {
  return normalizeOptionalProjectText(value);
}

function trimProjectSlug({ value }: TransformFnParams): unknown {
  return normalizeProjectSlug(value);
}

function trimProjectTechnologies({ value }: TransformFnParams): unknown {
  return normalizeProjectStringArray(value);
}

export class CreateProjectDto {
  @ApiProperty({
    example: 'Portfolio Backend',
    maxLength: 120,
  })
  @Transform(trimProjectText)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({
    example: 'portfolio-backend',
    maxLength: 160,
  })
  @IsOptional()
  @Transform(trimProjectSlug)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiProperty({
    example: 'NestJS backend with Prisma, JWT auth, and admin-managed projects.',
    maxLength: 300,
  })
  @Transform(trimProjectText)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  summary: string;

  @ApiPropertyOptional({
    example:
      'A backend API for a portfolio app with public project listing endpoints and admin CRUD.',
    nullable: true,
    maxLength: 5000,
  })
  @IsOptional()
  @Transform(trimOptionalProjectText)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/projects/portfolio-backend-cover.jpg',
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @Transform(trimOptionalProjectText)
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://portfolio.example.com',
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @Transform(trimOptionalProjectText)
  @IsString()
  @MaxLength(500)
  liveUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://github.com/example/portfolio-backend',
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @Transform(trimOptionalProjectText)
  @IsString()
  @MaxLength(500)
  repositoryUrl?: string | null;

  @ApiPropertyOptional({
    example: ['NestJS', 'Prisma', 'PostgreSQL'],
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @Transform(trimProjectTechnologies)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  technologies?: string[];

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
