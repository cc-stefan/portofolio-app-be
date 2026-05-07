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

export interface R2StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  endpoint: string;
}

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

export function getR2StorageConfig(): R2StorageConfig | null {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID?.trim() ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() ?? '',
    bucketName: process.env.R2_BUCKET_NAME?.trim() ?? '',
    publicUrl: normalizePublicUrl(process.env.R2_PUBLIC_URL),
    endpoint: normalizePublicUrl(process.env.R2_ENDPOINT),
  };

  const values = Object.values(config);

  if (values.every((value) => value.length === 0)) {
    return null;
  }

  const missingKeys = Object.entries(config)
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Incomplete R2 configuration. Missing: ${missingKeys.join(', ')}`,
    );
  }

  return config;
}

export function buildR2PublicFileUrl(
  key: string,
  config: Pick<R2StorageConfig, 'publicUrl'>,
): string {
  const normalizedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${config.publicUrl}/${normalizedKey}`;
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

function normalizePublicUrl(value?: string): string {
  return value?.trim().replace(/\/+$/, '') ?? '';
}
