module.exports = {
  isDuplicateKeyError: (error) =>
    error.name === 'MongoError' && error.code === 11000,
  isCastError: (error) => error.name === 'CastError',
  isValidationError: (error) => error.name === 'ValidationError',
};
