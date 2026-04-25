import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  const originalUploadDir = process.env.UPLOAD_DIR;
  const originalUploadUrlPrefix = process.env.UPLOAD_URL_PREFIX;
  let uploadsService: UploadsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.UPLOAD_DIR = await mkdtemp(
      join(tmpdir(), 'portfolio-uploads-'),
    );
    process.env.UPLOAD_URL_PREFIX = '/uploads';
    uploadsService = new UploadsService();
  });

  afterEach(() => {
    if (originalUploadDir === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = originalUploadDir;
    }

    if (originalUploadUrlPrefix === undefined) {
      delete process.env.UPLOAD_URL_PREFIX;
    } else {
      process.env.UPLOAD_URL_PREFIX = originalUploadUrlPrefix;
    }
  });

  it('stores project images inside the managed uploads directory', async () => {
    const file = {
      buffer: Buffer.from('image-bytes'),
      mimetype: 'image/png',
      originalname: 'cover.png',
      size: 11,
    };

    const storedUpload = await uploadsService.saveProjectImage(
      'portfolio-backend',
      file,
    );
    const persistedContents = await readFile(storedUpload.absolutePath, 'utf8');

    expect(storedUpload.url).toMatch(
      /^\/uploads\/project-images\/portfolio-backend-[0-9a-f-]+\.png$/,
    );
    expect(persistedContents).toBe('image-bytes');
  });

  it('deletes files only when they point to the managed project image prefix', async () => {
    const storedUpload = await uploadsService.saveProjectImage('project', {
      buffer: Buffer.from('image-bytes'),
      mimetype: 'image/jpeg',
      originalname: 'cover.jpg',
      size: 11,
    });

    await expect(
      uploadsService.deleteManagedFile('/uploads/not-managed/file.jpg'),
    ).resolves.toBe(false);
    await expect(
      uploadsService.deleteManagedFile(storedUpload.url),
    ).resolves.toBe(true);
    await expect(
      uploadsService.deleteManagedFile(storedUpload.url),
    ).resolves.toBe(false);
  });
});
