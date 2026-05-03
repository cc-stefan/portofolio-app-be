import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
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
  const uploadsService = {
    saveProjectImage: jest.fn(),
    deleteManagedFile: jest.fn(),
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
        {
          provide: UploadsService,
          useValue: uploadsService,
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
      imageUrl: null,
      liveUrl: null,
      repositoryUrl: null,
      projectDate: new Date('2024-05-20T00:00:00.000Z'),
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
      projectDate: '2024-05-20T00:00:00.000Z',
      technologies: ['NestJS', 'Prisma'],
      featured: true,
      displayOrder: 2,
    });

    expect(prismaService.project.create).toHaveBeenCalledWith({
      data: {
        title: 'Portfolio Backend',
        slug: 'portfolio-backend',
        summary: 'API summary',
        description: null,
        projectDate: new Date('2024-05-20T00:00:00.000Z'),
        liveUrl: null,
        repositoryUrl: null,
        technologies: ['NestJS', 'Prisma'],
        featured: true,
        published: false,
        displayOrder: 2,
      },
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

    await expect(
      service.findPublishedBySlug('missing-project'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the existing project when update payload is empty', async () => {
    const existingProject = {
      id: '99690f9a-4fdd-4334-bfea-8d09aef08103',
      title: 'Portfolio Backend',
      slug: 'portfolio-backend',
      summary: 'API summary',
      description: null,
      imageUrl: null,
      liveUrl: null,
      repositoryUrl: null,
      projectDate: null,
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

  it('maps nullable fields when updating a project', async () => {
    const existingProject = {
      id: '99690f9a-4fdd-4334-bfea-8d09aef08103',
      title: 'Portfolio Backend',
      slug: 'portfolio-backend',
      summary: 'API summary',
      description: 'Old description',
      imageUrl: null,
      liveUrl: 'https://portfolio.example.com',
      repositoryUrl: 'https://github.com/example/portfolio-backend',
      projectDate: new Date('2024-05-20T00:00:00.000Z'),
      technologies: ['NestJS'],
      featured: false,
      published: false,
      displayOrder: 0,
      createdAt: new Date('2026-04-25T09:00:00.000Z'),
      updatedAt: new Date('2026-04-25T09:00:00.000Z'),
    };
    prismaService.project.findUnique.mockResolvedValue(existingProject);
    prismaService.project.update.mockResolvedValue({
      ...existingProject,
      description: null,
      liveUrl: null,
      repositoryUrl: null,
      projectDate: null,
    });

    await service.update(existingProject.id, {
      description: null,
      liveUrl: null,
      repositoryUrl: null,
      projectDate: null,
    });

    expect(prismaService.project.update).toHaveBeenCalledWith({
      where: {
        id: existingProject.id,
      },
      data: {
        description: null,
        liveUrl: null,
        repositoryUrl: null,
        projectDate: null,
      },
    });
  });

  it('uploads a project image, updates the project, and deletes the previous managed file', async () => {
    const existingProject = {
      id: '99690f9a-4fdd-4334-bfea-8d09aef08103',
      title: 'Portfolio Backend',
      slug: 'portfolio-backend',
      summary: 'API summary',
      description: null,
      imageUrl: '/uploads/project-images/old-file.png',
      liveUrl: null,
      repositoryUrl: null,
      projectDate: null,
      technologies: [],
      featured: false,
      published: false,
      displayOrder: 0,
      createdAt: new Date('2026-04-25T09:00:00.000Z'),
      updatedAt: new Date('2026-04-25T09:00:00.000Z'),
    };
    const updatedProject = {
      ...existingProject,
      imageUrl: '/uploads/project-images/new-file.png',
    };

    prismaService.project.findUnique.mockResolvedValue(existingProject);
    prismaService.project.update.mockResolvedValue(updatedProject);
    uploadsService.saveProjectImage.mockResolvedValue({
      absolutePath: '/tmp/new-file.png',
      url: '/uploads/project-images/new-file.png',
    });
    uploadsService.deleteManagedFile.mockResolvedValue(true);

    const result = await service.uploadImage(existingProject.id, {
      buffer: Buffer.from('image-bytes'),
      mimetype: 'image/png',
      originalname: 'cover.png',
      size: 11,
    });

    expect(uploadsService.saveProjectImage).toHaveBeenCalledWith(
      'portfolio-backend',
      expect.objectContaining({
        mimetype: 'image/png',
      }),
    );
    expect(prismaService.project.update).toHaveBeenCalledWith({
      where: {
        id: existingProject.id,
      },
      data: {
        imageUrl: '/uploads/project-images/new-file.png',
      },
    });
    expect(uploadsService.deleteManagedFile).toHaveBeenCalledWith(
      '/uploads/project-images/old-file.png',
    );
    expect(result).toEqual(updatedProject);
  });

  it('removes the project image and clears the stored URL', async () => {
    const existingProject = {
      id: '99690f9a-4fdd-4334-bfea-8d09aef08103',
      title: 'Portfolio Backend',
      slug: 'portfolio-backend',
      summary: 'API summary',
      description: null,
      imageUrl: '/uploads/project-images/old-file.png',
      liveUrl: null,
      repositoryUrl: null,
      projectDate: null,
      technologies: [],
      featured: false,
      published: false,
      displayOrder: 0,
      createdAt: new Date('2026-04-25T09:00:00.000Z'),
      updatedAt: new Date('2026-04-25T09:00:00.000Z'),
    };
    prismaService.project.findUnique.mockResolvedValue(existingProject);
    prismaService.project.update.mockResolvedValue({
      ...existingProject,
      imageUrl: null,
    });
    uploadsService.deleteManagedFile.mockResolvedValue(true);

    const result = await service.removeImage(existingProject.id);

    expect(prismaService.project.update).toHaveBeenCalledWith({
      where: {
        id: existingProject.id,
      },
      data: {
        imageUrl: null,
      },
    });
    expect(uploadsService.deleteManagedFile).toHaveBeenCalledWith(
      existingProject.imageUrl,
    );
    expect(result.imageUrl).toBeNull();
  });
});
