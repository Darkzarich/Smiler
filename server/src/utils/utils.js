const path = require('path');
const fs = require('fs/promises');
const { logger } = require('../libs/logger');

module.exports = {
  /** Checks if the error is a MongoDB error with code 11000 (Duplicate key) */
  isDuplicateKeyError: (error) =>
    error.name === 'MongoError' && error.code === 11000,
  /** Checks if the error is a MongoDB cast error */
  isCastError: (error) => error.name === 'CastError',
  /** Checks if the error is a MongoDB validation error */
  isValidationError: (error) => error.name === 'ValidationError',
  success: (req, res, payload = undefined) => {
    res.status(200);

    if (!payload) {
      const response = {
        ok: true,
      };

      res.json(response);
      res.response = response;

      return;
    }

    res.json(payload);
    res.response = payload;
  },
  removeFileByPath: async (filePath) => {
    const absolutePath = path.join(process.cwd(), filePath);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.unlink(absolutePath);
    } catch (error) {
      logger.error(`Error removing file ${filePath}`);
      throw error;
    }
  },
};
