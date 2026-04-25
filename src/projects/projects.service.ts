import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadedImageFile, UploadsService } from '../uploads/uploads.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { slugifyProjectValue } from './projects.utils';

const projectOrderBy: Prisma.ProjectOrderByWithRelationInput[] = [
  {
    featured: 'desc',
  },
  {
    displayOrder: 'asc',
  },
  {
    createdAt: 'desc',
  },
];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const slug = this.resolveSlug(
      createProjectDto.title,
      createProjectDto.slug,
    );

    try {
      return await this.prisma.project.create({
        data: {
          title: createProjectDto.title,
          slug,
          summary: createProjectDto.summary,
          description: createProjectDto.description ?? null,
          coverImageUrl: createProjectDto.coverImageUrl ?? null,
          liveUrl: createProjectDto.liveUrl ?? null,
          repositoryUrl: createProjectDto.repositoryUrl ?? null,
          technologies: createProjectDto.technologies ?? [],
          featured: createProjectDto.featured ?? false,
          published: createProjectDto.published ?? false,
          displayOrder: createProjectDto.displayOrder ?? 0,
        },
      });
    } catch (error) {
      this.handleProjectPersistenceError(error);
    }
  }

  async findAllPublished(): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: {
        published: true,
      },
      orderBy: projectOrderBy,
    });
  }

  async findPublishedBySlug(slug: string): Promise<Project> {
    const normalizedSlug = this.normalizeLookupSlug(slug);
    const project = await this.prisma.project.findFirst({
      where: {
        slug: normalizedSlug,
        published: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findAllAdmin(): Promise<Project[]> {
    return this.prisma.project.findMany({
      orderBy: projectOrderBy,
    });
  }

  async findOneAdmin(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const existingProject = await this.findOneAdmin(id);
    const data: Prisma.ProjectUpdateInput = {};

    if (updateProjectDto.title !== undefined) {
      data.title = updateProjectDto.title;
    }

    if (updateProjectDto.slug !== undefined) {
      data.slug = this.resolveSlug(
        existingProject.title,
        updateProjectDto.slug,
      );
    }

    if (updateProjectDto.summary !== undefined) {
      data.summary = updateProjectDto.summary;
    }

    if (updateProjectDto.description !== undefined) {
      data.description = updateProjectDto.description;
    }

    if (updateProjectDto.coverImageUrl !== undefined) {
      data.coverImageUrl = updateProjectDto.coverImageUrl;
    }

    if (updateProjectDto.liveUrl !== undefined) {
      data.liveUrl = updateProjectDto.liveUrl;
    }

    if (updateProjectDto.repositoryUrl !== undefined) {
      data.repositoryUrl = updateProjectDto.repositoryUrl;
    }

    if (updateProjectDto.technologies !== undefined) {
      data.technologies = updateProjectDto.technologies;
    }

    if (updateProjectDto.featured !== undefined) {
      data.featured = updateProjectDto.featured;
    }

    if (updateProjectDto.published !== undefined) {
      data.published = updateProjectDto.published;
    }

    if (updateProjectDto.displayOrder !== undefined) {
      data.displayOrder = updateProjectDto.displayOrder;
    }

    if (Object.keys(data).length === 0) {
      return existingProject;
    }

    try {
      const updatedProject = await this.prisma.project.update({
        where: {
          id,
        },
        data,
      });

      if (
        updateProjectDto.coverImageUrl !== undefined &&
        updateProjectDto.coverImageUrl !== existingProject.coverImageUrl
      ) {
        await this.cleanupManagedFile(existingProject.coverImageUrl);
      }

      return updatedProject;
    } catch (error) {
      this.handleProjectPersistenceError(error);
    }
  }

  async uploadCoverImage(
    id: string,
    file: UploadedImageFile | undefined,
  ): Promise<Project> {
    if (!file) {
      throw new BadRequestException('Project image file is required');
    }

    const existingProject = await this.findOneAdmin(id);
    const storedUpload = await this.uploadsService.saveProjectImage(
      existingProject.slug,
      file,
    );

    try {
      const updatedProject = await this.prisma.project.update({
        where: {
          id,
        },
        data: {
          coverImageUrl: storedUpload.url,
        },
      });

      await this.cleanupManagedFile(existingProject.coverImageUrl);

      return updatedProject;
    } catch (error) {
      await this.uploadsService.deleteManagedFile(storedUpload.url);
      this.handleProjectPersistenceError(error);
    }
  }

  async removeCoverImage(id: string): Promise<Project> {
    const existingProject = await this.findOneAdmin(id);

    try {
      const updatedProject = await this.prisma.project.update({
        where: {
          id,
        },
        data: {
          coverImageUrl: null,
        },
      });

      await this.cleanupManagedFile(existingProject.coverImageUrl);

      return updatedProject;
    } catch (error) {
      this.handleProjectPersistenceError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const existingProject = await this.findOneAdmin(id);

    try {
      await this.prisma.project.delete({
        where: {
          id,
        },
      });
      await this.cleanupManagedFile(existingProject.coverImageUrl);
    } catch (error) {
      this.handleProjectPersistenceError(error);
    }
  }

  private resolveSlug(title: string, explicitSlug?: string): string {
    const slug = explicitSlug ?? slugifyProjectValue(title);

    if (!slug) {
      throw new BadRequestException(
        'Project title or slug must contain letters or numbers',
      );
    }

    return slug;
  }

  private normalizeLookupSlug(slug: string): string {
    const normalizedSlug = slugifyProjectValue(slug);

    if (!normalizedSlug) {
      throw new NotFoundException('Project not found');
    }

    return normalizedSlug;
  }

  private handleProjectPersistenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Project slug is already in use');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
    }

    throw error;
  }

  private async cleanupManagedFile(
    fileUrl: string | null | undefined,
  ): Promise<void> {
    try {
      await this.uploadsService.deleteManagedFile(fileUrl);
    } catch {
      return;
    }
  }
}
