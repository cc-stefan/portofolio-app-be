import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  it('creates a project and derives the slug from the title', async () => {
    const createdProject = {
      id: '99690f9a-4fdd-4334-bfea-8d09aef08103',
      title: 'Portfolio Backend',
      slug: 'portfolio-backend',
      summary: 'API summary',
      description: null,
      coverImageUrl: null,
      liveUrl: null,
      repositoryUrl: null,
      technologies: ['NestJS', 'Prisma'],
      featured: true,
      published: false,
      displayOrder: 2,
      createdAt: new Date('2026-04-25T09:00:00.000Z'),
      updatedAt: new Date('2026-04-25T09:00:00.000Z'),
    };
    prismaService.project.create.mockResolvedValue(createdProject);

    const result = await service.create({
      title: 'Portfolio Backend',
      summary: 'API summary',
      technologies: ['NestJS', 'Prisma'],
      featured: true,
      displayOrder: 2,
    });

    expect(prismaService.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Portfolio Backend',
        slug: 'portfolio-backend',
        summary: 'API summary',
        technologies: ['NestJS', 'Prisma'],
        featured: true,
        published: false,
        displayOrder: 2,
      }),
    });
    expect(result).toEqual(createdProject);
  });

  it('lists only published projects for the public API', async () => {
    prismaService.project.findMany.mockResolvedValue([]);

    await service.findAllPublished();

    expect(prismaService.project.findMany).toHaveBeenCalledWith({
      where: {
        published: true,
      },
      orderBy: [
        { featured: 'desc' },
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  });

  it('throws when a published project cannot be found by slug', async () => {
    prismaService.project.findFirst.mockResolvedValue(null);

    await expect(service.findPublishedBySlug('missing-project')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns the existing project when update payload is empty', async () => {
    const existingProject = {
      id: '99690f9a-4fdd-4334-bfea-8d09aef08103',
      title: 'Portfolio Backend',
      slug: 'portfolio-backend',
      summary: 'API summary',
      description: null,
      coverImageUrl: null,
      liveUrl: null,
      repositoryUrl: null,
      technologies: [],
      featured: false,
      published: false,
      displayOrder: 0,
      createdAt: new Date('2026-04-25T09:00:00.000Z'),
      updatedAt: new Date('2026-04-25T09:00:00.000Z'),
    };
    prismaService.project.findUnique.mockResolvedValue(existingProject);

    const result = await service.update(existingProject.id, {});

    expect(prismaService.project.update).not.toHaveBeenCalled();
    expect(result).toEqual(existingProject);
  });
});
