import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { supportedProjectLocales } from '../project-locales';
import { normalizeProjectLocale } from '../projects.utils';

function trimProjectLocale({ value }: TransformFnParams): unknown {
  return normalizeProjectLocale(value);
}

export class ProjectLocaleQueryDto {
  @ApiPropertyOptional({
    enum: supportedProjectLocales,
    enumName: 'ProjectLocale',
    example: 'ro',
  })
  @IsOptional()
  @Transform(trimProjectLocale)
  @IsString()
  @IsIn(supportedProjectLocales)
  locale?: string;
}
