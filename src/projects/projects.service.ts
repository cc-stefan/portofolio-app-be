import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadedImageFile, UploadsService } from '../uploads/uploads.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectTranslationInputDto } from './dto/project-translation.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { defaultProjectLocale } from './project-locales';
import {
  type ProjectTranslationRecord,
  projectWithTranslationsInclude,
  type ProjectWithTranslationsRecord,
} from './project-records';
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

type PublicProjectRecord = Omit<
  ProjectWithTranslationsRecord,
  'translations'
> & {
  title: string;
  summary: string;
  description: string | null;
  contentLocale: string;
  availableLocales: string[];
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectWithTranslationsRecord> {
    const slug = this.resolveSlug(
      this.getDefaultTranslationTitle(createProjectDto.translations),
      createProjectDto.slug,
    );

    try {
      return await this.prisma.project.create({
        data: {
          slug,
          translations: {
            create: this.mapTranslationsForWrite(createProjectDto.translations),
          },
          projectDate:
            this.parseProjectDate(createProjectDto.projectDate) ?? null,
          liveUrl: createProjectDto.liveUrl ?? null,
          repositoryUrl: createProjectDto.repositoryUrl ?? null,
          technologies: createProjectDto.technologies ?? [],
          featured: createProjectDto.featured ?? false,
          published: createProjectDto.published ?? false,
          displayOrder: createProjectDto.displayOrder ?? 0,
        },
        include: projectWithTranslationsInclude,
      });
    } catch (error) {
      this.handleProjectPersistenceError(error);
    }
  }

  async findAllPublished(locale?: string): Promise<PublicProjectRecord[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        published: true,
      },
      orderBy: projectOrderBy,
      include: projectWithTranslationsInclude,
    });

    return projects
      .map((project) => this.mapProjectToPublicProject(project, locale))
      .filter((project): project is PublicProjectRecord => project !== null);
  }

  async findPublishedBySlug(
    slug: string,
    locale?: string,
  ): Promise<PublicProjectRecord> {
    const normalizedSlug = this.normalizeLookupSlug(slug);
    const project = await this.prisma.project.findFirst({
      where: {
        slug: normalizedSlug,
        published: true,
      },
      include: projectWithTranslationsInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const localizedProject = this.mapProjectToPublicProject(project, locale);

    if (!localizedProject) {
      throw new NotFoundException('Project not found');
    }

    return localizedProject;
  }

  async findAllAdmin(): Promise<ProjectWithTranslationsRecord[]> {
    return this.prisma.project.findMany({
      orderBy: projectOrderBy,
      include: projectWithTranslationsInclude,
    });
  }

  async findOneAdmin(id: string): Promise<ProjectWithTranslationsRecord> {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },
      include: projectWithTranslationsInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectWithTranslationsRecord> {
    const existingProject = await this.findOneAdmin(id);
    const data: Prisma.ProjectUpdateInput = {};

    if (updateProjectDto.slug !== undefined) {
      data.slug = this.resolveSlug(
        this.getDefaultTranslationTitle(existingProject.translations),
        updateProjectDto.slug,
      );
    }

    if (updateProjectDto.translations !== undefined) {
      data.translations = {
        deleteMany: {},
        create: this.mapTranslationsForWrite(updateProjectDto.translations),
      };
    }

    if (updateProjectDto.projectDate !== undefined) {
      data.projectDate = this.parseProjectDate(updateProjectDto.projectDate);
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
        include: projectWithTranslationsInclude,
      });

      return updatedProject;
    } catch (error) {
      this.handleProjectPersistenceError(error);
    }
  }

  async uploadImage(
    id: string,
    file: UploadedImageFile | undefined,
  ): Promise<ProjectWithTranslationsRecord> {
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
          imageUrl: storedUpload.url,
        },
        include: projectWithTranslationsInclude,
      });

      await this.cleanupManagedFile(existingProject.imageUrl);

      return updatedProject;
    } catch (error) {
      await this.uploadsService.deleteManagedFile(storedUpload.url);
      this.handleProjectPersistenceError(error);
    }
  }

  async removeImage(id: string): Promise<ProjectWithTranslationsRecord> {
    const existingProject = await this.findOneAdmin(id);

    try {
      const updatedProject = await this.prisma.project.update({
        where: {
          id,
        },
        data: {
          imageUrl: null,
        },
        include: projectWithTranslationsInclude,
      });

      await this.cleanupManagedFile(existingProject.imageUrl);

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
      await this.cleanupManagedFile(existingProject.imageUrl);
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

  private parseProjectDate(
    value: string | null | undefined,
  ): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return new Date(value);
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

  private getDefaultTranslationTitle(
    translations: Array<{ locale: string; title: string }>,
  ): string {
    const defaultTranslation = translations.find(
      (translation) => translation.locale === defaultProjectLocale,
    );

    if (!defaultTranslation?.title) {
      throw new BadRequestException(
        `Translations must include the ${defaultProjectLocale} locale`,
      );
    }

    return defaultTranslation.title;
  }

  private mapTranslationsForWrite(
    translations: ProjectTranslationInputDto[],
  ): Array<{
    locale: string;
    title: string;
    summary: string;
    description: string | null;
  }> {
    return translations
      .slice()
      .sort((left, right) => left.locale.localeCompare(right.locale))
      .map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        summary: translation.summary,
        description: translation.description ?? null,
      }));
  }

  private mapProjectToPublicProject(
    project: ProjectWithTranslationsRecord,
    requestedLocale?: string,
  ): PublicProjectRecord | null {
    const translation = this.resolveProjectTranslation(
      project.translations,
      requestedLocale,
    );

    if (!translation) {
      return null;
    }

    const { translations, ...projectFields } = project;

    return {
      ...projectFields,
      title: translation.title,
      summary: translation.summary,
      description: translation.description ?? null,
      contentLocale: translation.locale,
      availableLocales: translations.map((entry) => entry.locale),
    };
  }

  private resolveProjectTranslation(
    translations: ProjectTranslationRecord[],
    requestedLocale?: string,
  ): ProjectTranslationRecord | undefined {
    if (requestedLocale) {
      const requestedTranslation = translations.find(
        (translation) => translation.locale === requestedLocale,
      );

      if (requestedTranslation) {
        return requestedTranslation;
      }
    }

    return (
      translations.find(
        (translation) => translation.locale === defaultProjectLocale,
      ) ?? translations[0]
    );
  }
}
