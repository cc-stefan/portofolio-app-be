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
