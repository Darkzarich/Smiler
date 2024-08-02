module.exports = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    const error = new Error(
      'Auth is required for this operation. Please sign in.',
    );
    res.status(401).json({
      error: {
        message: error.message,
      },
    });
  }
};