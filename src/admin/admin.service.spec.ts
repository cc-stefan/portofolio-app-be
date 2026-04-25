import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  const prismaService = {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  it('returns dashboard stats and recent activity for the admin dashboard', async () => {
    const recentProjects = [
      {
        id: '99690f9a-4fdd-4334-bfea-8d09aef08103',
        title: 'Portfolio Backend',
        slug: 'portfolio-backend',
        published: true,
        featured: true,
        coverImageUrl: '/uploads/project-images/portfolio-backend.png',
        createdAt: new Date('2026-04-25T09:00:00.000Z'),
        updatedAt: new Date('2026-04-26T09:00:00.000Z'),
      },
    ];
    const recentUsers = [
      {
        id: 'd47e7488-c1d8-4e2d-ac28-a4326b32e1c7',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        createdAt: new Date('2026-04-24T09:00:00.000Z'),
        updatedAt: new Date('2026-04-25T09:00:00.000Z'),
      },
    ];

    prismaService.project.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prismaService.user.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    prismaService.project.findMany.mockResolvedValue(recentProjects);
    prismaService.user.findMany.mockResolvedValue(recentUsers);

    const result = await service.getDashboardOverview();

    expect(prismaService.project.count).toHaveBeenNthCalledWith(1);
    expect(prismaService.project.count).toHaveBeenNthCalledWith(2, {
      where: {
        published: true,
      },
    });
    expect(prismaService.project.count).toHaveBeenNthCalledWith(3, {
      where: {
        featured: true,
      },
    });
    expect(prismaService.project.count).toHaveBeenNthCalledWith(4, {
      where: {
        coverImageUrl: {
          not: null,
        },
      },
    });
    expect(prismaService.user.count).toHaveBeenNthCalledWith(1);
    expect(prismaService.user.count).toHaveBeenNthCalledWith(2, {
      where: {
        role: UserRole.ADMIN,
      },
    });
    expect(prismaService.project.findMany).toHaveBeenCalledWith({
      take: 5,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        featured: true,
        coverImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      take: 5,
      orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.stats).toEqual({
      totalProjects: 4,
      publishedProjects: 3,
      draftProjects: 1,
      featuredProjects: 2,
      projectsWithImages: 1,
      totalUsers: 5,
      adminUsers: 2,
      regularUsers: 3,
    });
    expect(result.recentProjects).toEqual(recentProjects);
    expect(result.recentUsers).toEqual(recentUsers);
  });
});
