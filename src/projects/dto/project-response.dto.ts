import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { supportedProjectLocales } from '../project-locales';
import { ProjectTranslationResponseDto } from './project-translation.dto';

class BaseProjectResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({
    nullable: true,
    example: '2024-05-20T00:00:00.000Z',
  })
  projectDate?: Date | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  liveUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  repositoryUrl?: string | null;

  @ApiProperty({
    type: [String],
  })
  technologies: string[];

  @ApiProperty()
  featured: boolean;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PublicProjectResponseDto extends BaseProjectResponseDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  summary: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    enum: supportedProjectLocales,
    enumName: 'ProjectLocale',
  })
  contentLocale: string;

  @ApiProperty({
    enum: supportedProjectLocales,
    enumName: 'ProjectLocale',
    isArray: true,
  })
  availableLocales: string[];
}

export class AdminProjectResponseDto extends BaseProjectResponseDto {
  @ApiProperty({
    type: ProjectTranslationResponseDto,
    isArray: true,
  })
  translations: ProjectTranslationResponseDto[];
}
