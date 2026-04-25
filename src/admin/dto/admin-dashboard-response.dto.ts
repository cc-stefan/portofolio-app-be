import { UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminDashboardStatsDto {
  @ApiProperty()
  totalProjects: number;

  @ApiProperty()
  publishedProjects: number;

  @ApiProperty()
  draftProjects: number;

  @ApiProperty()
  featuredProjects: number;

  @ApiProperty()
  projectsWithImages: number;

  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  adminUsers: number;

  @ApiProperty()
  regularUsers: number;
}

export class AdminDashboardProjectDto {
  @ApiProperty({
    format: 'uuid',
  })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  featured: boolean;

  @ApiPropertyOptional({
    nullable: true,
  })
  coverImageUrl?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AdminDashboardUserDto {
  @ApiProperty({
    format: 'uuid',
  })
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
  })
  role: UserRole;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AdminDashboardOverviewDto {
  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({
    type: AdminDashboardStatsDto,
  })
  stats: AdminDashboardStatsDto;

  @ApiProperty({
    type: AdminDashboardProjectDto,
    isArray: true,
  })
  recentProjects: AdminDashboardProjectDto[];

  @ApiProperty({
    type: AdminDashboardUserDto,
    isArray: true,
  })
  recentUsers: AdminDashboardUserDto[];
}
