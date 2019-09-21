module.exports = {
  required: (req, res, next) => {
    if (req.session.userId) {
      next();
    } else {
      const error = new Error('Auth is required for this operation. Please log in.');
      res.status(401).json({
        error: {
          message: error.message,
        },
      });
    }
  },
};
