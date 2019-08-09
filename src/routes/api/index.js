const router = require('express').Router();

router.use('/users', require('./users'));
router.use('/posts', require('./posts'));

router.use((err, req, res, next) => {
  res.status(422).json({
    error: {
      message: err.message,
    },
  });

  return next(err);
});

module.exports = router;
