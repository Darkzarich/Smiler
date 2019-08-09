const crypto = require('crypto');
const User = require('../models/User');

module.exports = {
  register: async (req, res, next) => {
    const user = {
      login: req.body.login,
      password: req.body.password,
      confirm: req.body.confirm,
    };

    const error = validateUser(user);

    if (error) {
      next(error);
    } else {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(user.password, salt, 10000, 512, 'sha512').toString('hex');

      try {
        await User.create({
          login: user.login,
          hash,
          salt,
        });
        res.status(200).json({ ok: true });
      } catch (e) {
        next(e);
      }
    }
  },
};

const validateUser = (user) => {
  if (user.login && user.password && user.confirm) {
    if (user.login.length < 3 || user.login.length > 10) {
      return new Error('Login length must be 3-10 symbols');
    }
    if (user.password.length < 6) {
      return new Error('Password length must be not less than 6');
    }
    if (user.password !== user.confirm) {
      return new Error('Password and password confirm must be equal');
    }
    return null;
  }
  return new Error('All fields must be filled.');
};
