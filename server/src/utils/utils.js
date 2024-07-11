const logger = require('../config/winston');

module.exports = {
  /**
   * wrapper for global catch handling
   */
  asyncErrorHandler: (fn) => (req, res, next) => {
    fn(req, res, next).catch((e) => next(e));
  },
  generateError: (error, status, next) => {
    if (status) {
      next({
        status,
        error: new Error(error),
      });
    } else {
      next({
        error: new Error(error),
      });
    }
  },
  success: (
    req,
    res,
    payload = undefined,
    additionalData = { userId: 'no-auth' },
  ) => {
    const userId = req.session ? req.session.userId : additionalData.userId;

    if (payload) {
      logger.info(
        `[req_id: ${req.id}][uid: ${userId}] [200] "${req.originalUrl}" responded with ${JSON.stringify(payload)}`,
      );
      res.status(200).json(payload);
    } else {
      logger.info(
        `[req_id: ${req.id}][uid: ${userId}] [200] "${req.originalUrl}" responded with ${JSON.stringify({ ok: true })}`,
      );
      res.status(200).json({
        ok: true,
      });
    }
  },
};
