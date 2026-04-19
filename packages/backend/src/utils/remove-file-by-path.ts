import { resolve } from 'path';
import { unlink } from 'fs/promises';
import { logger } from '@libs/logger';
import { BASE_UPLOAD_FOLDER } from '@constants/index';

const UPLOADS_DIR = resolve(
  process.cwd(),
  BASE_UPLOAD_FOLDER.replace(/^\//, ''),
);

export async function removeFileByPath(filePath: string) {
  const absolutePath = resolve(process.cwd(), filePath.replace(/^\//, ''));

  if (!absolutePath.startsWith(`${UPLOADS_DIR}/`)) {
    logger.error(`Path traversal attempt detected: ${filePath}`);
    return;
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await unlink(absolutePath);
  } catch {
    logger.error(`Error removing file ${filePath}`);
  }
}
