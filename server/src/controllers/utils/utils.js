module.exports = {
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
  success: (res, payload = undefined) => {
    if (payload) {
      res.status(200).json(payload);
    } else {
      res.status(200).json({
        ok: true,
      });
    }
  },
};
