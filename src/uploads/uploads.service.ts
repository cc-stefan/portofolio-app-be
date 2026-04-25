import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ALLOWED_PROJECT_IMAGE_MIME_TYPES,
  buildProjectImageUrl,
  getProjectImagesRootPath,
  getProjectImagesUrlPrefix,
  getUploadsRootPath,
  getUploadsUrlPrefix,
} from './uploads.config';

export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
  size: number;
}

export interface StoredUpload {
  absolutePath: string;
  url: string;
}

@Injectable()
export class UploadsService {
  async saveProjectImage(
    projectSlug: string,
    file: UploadedImageFile,
  ): Promise<StoredUpload> {
    if (!ALLOWED_PROJECT_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP, GIF, and AVIF images are supported',
      );
    }

    const extension = this.resolveFileExtension(file);
    const fileName = `${this.sanitizeFileName(projectSlug)}-${randomUUID()}.${extension}`;
    const projectImagesRootPath = getProjectImagesRootPath();

    await mkdir(projectImagesRootPath, {
      recursive: true,
    });

    const absolutePath = resolve(projectImagesRootPath, fileName);

    await writeFile(absolutePath, file.buffer);

    return {
      absolutePath,
      url: buildProjectImageUrl(fileName),
    };
  }

  async deleteManagedFile(
    fileUrl: string | null | undefined,
  ): Promise<boolean> {
    const absolutePath = this.resolveManagedFilePath(fileUrl);

    if (!absolutePath) {
      return false;
    }

    try {
      await unlink(absolutePath);
      return true;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  private resolveFileExtension(file: UploadedImageFile): string {
    const extensionFromMimeType = ALLOWED_PROJECT_IMAGE_MIME_TYPES.get(
      file.mimetype,
    );

    if (extensionFromMimeType) {
      return extensionFromMimeType;
    }

    const extensionFromFileName = extname(file.originalname ?? '')
      .toLowerCase()
      .replace(/^\./, '');

    return extensionFromFileName || 'bin';
  }

  private resolveManagedFilePath(
    fileUrl: string | null | undefined,
  ): string | null {
    if (!fileUrl) {
      return null;
    }

    const pathname = this.extractPathname(fileUrl);
    const uploadsUrlPrefix = getUploadsUrlPrefix();
    const projectImagesUrlPrefix = `${getProjectImagesUrlPrefix()}/`;

    if (
      !pathname.startsWith(`${uploadsUrlPrefix}/`) ||
      !pathname.startsWith(projectImagesUrlPrefix)
    ) {
      return null;
    }

    const relativePath = pathname.slice(uploadsUrlPrefix.length + 1);
    const uploadsRootPath = getUploadsRootPath();
    const absolutePath = resolve(uploadsRootPath, relativePath);
    const relativePathFromRoot = relative(uploadsRootPath, absolutePath);

    if (!relativePathFromRoot || relativePathFromRoot.startsWith('..')) {
      return null;
    }

    return absolutePath;
  }

  private extractPathname(fileUrl: string): string {
    try {
      return new URL(fileUrl).pathname;
    } catch {
      return fileUrl.split('?')[0].split('#')[0];
    }
  }

  private sanitizeFileName(value: string): string {
    const normalizedValue = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

    return normalizedValue || 'project';
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
