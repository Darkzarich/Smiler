const logger = require('../../config/winston');

module.exports = {
  /**
   * wrapper for global catch handling
  */
  asyncErrorHandler: fn => (req, res, next) => {
    logger.info(`[req_id: ${req.id}][uid: ${req.session.userId || 'no auth'}] [200] "${req.originalUrl}" started with ${JSON.stringify(req.body)}`);
    fn(req, res, next).catch(e => next(e));
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
  success: (req, res, payload = undefined) => {
    if (payload) {
      logger.info(`[req_id: ${req.id}][uid: ${req.session.userId || 'no auth'}] [200] "${req.originalUrl}" responsed with ${JSON.stringify(payload)}`);
      res.status(200).json(payload);
    } else {
      logger.info(`[req_id: ${req.id}][uid: ${req.session.userId || 'no auth'}] [200] "${req.originalUrl}" responsed with ${JSON.stringify({ ok: true })}`);
      res.status(200).json({
        ok: true,
      });
    }
  },
};
