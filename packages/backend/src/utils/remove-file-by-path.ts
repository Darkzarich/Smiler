import { join } from 'path';
import { unlink } from 'fs/promises';
import { logger } from '@libs/logger';

export async function removeFileByPath(filePath: string) {
  const absolutePath = join(process.cwd(), filePath);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await unlink(absolutePath);
  } catch (error) {
    logger.error(`Error removing file ${filePath}`);
    throw error;
  }
}
