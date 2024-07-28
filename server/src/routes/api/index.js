const router = require('express').Router();
const { asyncErrorHandler } = require('../../utils/utils');
const { IS_JEST } = require('../../config/config');
const logger = require('../../config/logger');

router.use('/users', require('./users'));
router.use('/auth', require('./auth'));
router.use('/posts', require('./posts'));
router.use('/comments', require('./comments'));
router.use('/tags', require('./tags'));

// Special endpoint to test global error handling middleware in Jest environment
if (IS_JEST) {
  router.get(
    '/error-endpoint',
    asyncErrorHandler(() => {
      throw new Error('Some error');
    }),
  );
}

// eslint-disable-next-line no-unused-vars
router.all('*', (req, res, next) => {
  res.status(404).send('Not Found');
});

// Specifying four parameters is a must for global error handling
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err.status) {
    res.response = err.error.message;
    res.status(err.status).json({
      error: {
        message: err.error.message,
      },
    });
  } else {
    // TODO: validate mongo db error

    logger.error(err, {
      requestId: req.id,
    });

    const message = 'Internal server error';

    res.response = message;
    res.status(500).json({
      error: {
        message,
      },
    });
  }
});

module.exports = router;
