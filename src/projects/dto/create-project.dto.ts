import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsDateString,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  normalizeOptionalProjectText,
  normalizeProjectSlug,
  normalizeProjectStringArray,
} from '../projects.utils';
import {
  HasDefaultProjectLocaleConstraint,
  ProjectTranslationInputDto,
} from './project-translation.dto';

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
    type: [ProjectTranslationInputDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((translation: ProjectTranslationInputDto) => translation.locale)
  @ValidateNested({ each: true })
  @Type(() => ProjectTranslationInputDto)
  @Validate(HasDefaultProjectLocaleConstraint)
  translations: ProjectTranslationInputDto[];

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

  @ApiPropertyOptional({
    example: '2024-05-20',
    nullable: true,
  })
  @IsOptional()
  @Transform(trimOptionalProjectText)
  @IsDateString()
  projectDate?: string | null;

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
