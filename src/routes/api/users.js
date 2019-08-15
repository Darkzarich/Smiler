const router = require('express').Router();
const usersController = require('../../controllers/users');
const auth = require('../auth');

router.post('/', usersController.register);
router.post('/auth', usersController.auth);
router.delete('/', auth.required, usersController.logout);

module.exports = router;
