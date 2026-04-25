import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const recentProjectsSelect = {
  id: true,
  title: true,
  slug: true,
  published: true,
  featured: true,
  coverImageUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const recentUsersSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview() {
    const [
      totalProjects,
      publishedProjects,
      featuredProjects,
      projectsWithImages,
      totalUsers,
      adminUsers,
      recentProjects,
      recentUsers,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({
        where: {
          published: true,
        },
      }),
      this.prisma.project.count({
        where: {
          featured: true,
        },
      }),
      this.prisma.project.count({
        where: {
          coverImageUrl: {
            not: null,
          },
        },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          role: UserRole.ADMIN,
        },
      }),
      this.prisma.project.findMany({
        take: 5,
        orderBy: [
          {
            updatedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        select: recentProjectsSelect,
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            updatedAt: 'desc',
          },
        ],
        select: recentUsersSelect,
      }),
    ]);

    return {
      generatedAt: new Date(),
      stats: {
        totalProjects,
        publishedProjects,
        draftProjects: totalProjects - publishedProjects,
        featuredProjects,
        projectsWithImages,
        totalUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
      },
      recentProjects,
      recentUsers,
    };
  }
}
