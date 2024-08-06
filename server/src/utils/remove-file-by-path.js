const path = require('path');
const fs = require('fs/promises');
const { logger } = require('../libs/logger');

async function removeFileByPath(filePath) {
  const absolutePath = path.join(process.cwd(), filePath);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.unlink(absolutePath);
  } catch (error) {
    logger.error(`Error removing file ${filePath}`);
    throw error;
  }
}

module.exports.removeFileByPath = removeFileByPath;
