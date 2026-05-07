import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, posix, relative, resolve } from 'node:path';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ALLOWED_PROJECT_IMAGE_MIME_TYPES,
  buildR2PublicFileUrl,
  buildProjectImageUrl,
  getProjectImagesRootPath,
  getProjectImagesUrlPrefix,
  getR2StorageConfig,
  getUploadsRootPath,
  getUploadsUrlPrefix,
  type R2StorageConfig,
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
  private readonly r2Config = getR2StorageConfig();
  private readonly r2Client = this.createR2Client(this.r2Config);

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
    const sanitizedProjectSlug = this.sanitizeFileName(projectSlug);
    const fileName = `${sanitizedProjectSlug}-${randomUUID()}.${extension}`;

    if (this.r2Client && this.r2Config) {
      return this.saveProjectImageToR2(
        sanitizedProjectSlug,
        fileName,
        file,
        this.r2Config,
      );
    }

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
    const r2ObjectKey = this.resolveManagedR2ObjectKey(fileUrl);

    if (r2ObjectKey && this.r2Client && this.r2Config) {
      await this.r2Client.send(
        new DeleteObjectCommand({
          Bucket: this.r2Config.bucketName,
          Key: r2ObjectKey,
        }),
      );

      return true;
    }

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

  private async saveProjectImageToR2(
    sanitizedProjectSlug: string,
    fileName: string,
    file: UploadedImageFile,
    config: R2StorageConfig,
  ): Promise<StoredUpload> {
    if (!this.r2Client) {
      throw new Error('R2 client is not configured');
    }

    const objectKey = posix.join(
      'projects',
      sanitizedProjectSlug,
      'cover',
      fileName,
    );

    await this.r2Client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      absolutePath: objectKey,
      url: buildR2PublicFileUrl(objectKey, config),
    };
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

  private resolveManagedR2ObjectKey(
    fileUrl: string | null | undefined,
  ): string | null {
    if (!fileUrl || !this.r2Config) {
      return null;
    }

    let publicUrl: URL;

    try {
      publicUrl = new URL(this.r2Config.publicUrl);
    } catch {
      return null;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      return null;
    }

    if (parsedUrl.origin !== publicUrl.origin) {
      return null;
    }

    const objectKey = parsedUrl.pathname.replace(/^\/+/, '');

    return objectKey.startsWith('projects/') ? objectKey : null;
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

  private createR2Client(config: R2StorageConfig | null): S3Client | null {
    if (!config) {
      return null;
    }

    return new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
