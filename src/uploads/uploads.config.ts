import { resolve } from 'node:path';

const DEFAULT_UPLOAD_DIR = 'uploads';
const DEFAULT_UPLOAD_URL_PREFIX = '/uploads';

export const PROJECT_IMAGES_DIRECTORY = 'project-images';
export const PROJECT_IMAGE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PROJECT_IMAGE_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
]);

export function getUploadsRootPath(): string {
  return resolve(process.cwd(), normalizeUploadDir(process.env.UPLOAD_DIR));
}

export function getUploadsUrlPrefix(): string {
  return normalizeUploadUrlPrefix(process.env.UPLOAD_URL_PREFIX);
}

export function getProjectImagesRootPath(): string {
  return resolve(getUploadsRootPath(), PROJECT_IMAGES_DIRECTORY);
}

export function getProjectImagesUrlPrefix(): string {
  return `${getUploadsUrlPrefix()}/${PROJECT_IMAGES_DIRECTORY}`;
}

export function buildProjectImageUrl(fileName: string): string {
  return `${getProjectImagesUrlPrefix()}/${fileName}`;
}

function normalizeUploadDir(value?: string): string {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : DEFAULT_UPLOAD_DIR;
}

function normalizeUploadUrlPrefix(value?: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return DEFAULT_UPLOAD_URL_PREFIX;
  }

  const normalizedValue = trimmedValue.replace(/^\/+|\/+$/g, '');

  return normalizedValue ? `/${normalizedValue}` : DEFAULT_UPLOAD_URL_PREFIX;
}
