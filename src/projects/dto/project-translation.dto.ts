import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  defaultProjectLocale,
  supportedProjectLocales,
} from '../project-locales';
import {
  normalizeOptionalProjectText,
  normalizeProjectLocale,
  normalizeProjectText,
} from '../projects.utils';

function trimProjectLocale({ value }: TransformFnParams): unknown {
  return normalizeProjectLocale(value);
}

function trimProjectText({ value }: TransformFnParams): unknown {
  return normalizeProjectText(value);
}

function trimOptionalProjectText({ value }: TransformFnParams): unknown {
  return normalizeOptionalProjectText(value);
}

@ValidatorConstraint({ name: 'hasDefaultProjectLocale', async: false })
export class HasDefaultProjectLocaleConstraint implements ValidatorConstraintInterface {
  validate(
    value: Array<{ locale?: string }> | undefined,
  ): value is Array<{ locale: string }> {
    return (
      Array.isArray(value) &&
      value.some((translation) => translation.locale === defaultProjectLocale)
    );
  }

  defaultMessage(): string {
    return `Translations must include the ${defaultProjectLocale} locale`;
  }
}

export class ProjectTranslationInputDto {
  @ApiProperty({
    enum: supportedProjectLocales,
    enumName: 'ProjectLocale',
    example: 'en',
  })
  @Transform(trimProjectLocale)
  @IsString()
  @IsIn(supportedProjectLocales)
  locale: string;

  @ApiProperty({
    example: 'Portfolio Backend',
    maxLength: 120,
  })
  @Transform(trimProjectText)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    example:
      'NestJS backend with Prisma, JWT auth, and admin-managed projects.',
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
}

export class ProjectTranslationResponseDto {
  @ApiProperty({
    enum: supportedProjectLocales,
    enumName: 'ProjectLocale',
    example: 'en',
  })
  locale: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  summary: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description?: string | null;
}
