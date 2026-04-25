import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  summary: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  coverImageUrl?: string | null;

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
