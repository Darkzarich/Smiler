const router = require('express').Router();
const logger = require('../../config/winston');

router.use('/users', require('./users'));
router.use('/posts', require('./posts'));
router.use('/comments', require('./comments'));
router.use('/tags', require('./tags'));

router.use((err, req, res, next) => {
  if (err.status) {
    logger.warn(`[req_id: ${req.id}][uid: ${req.session.userId}] [${err.status}] ${err.error.message}`);
    res.status(err.status).json({
      error: {
        message: err.error.message,
      },
    });
  } else {
    // TODO: validate mongo db error

    logger.error(`[req_id: ${req.id}][uid: ${req.session.userId}] [500]`, err);
    res.status(500).json({
      error: {
        message: 'Internal Server Error',
      },
    });
  }
});

module.exports = router;
