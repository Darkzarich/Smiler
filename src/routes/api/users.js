const router = require('express').Router();
const usersController = require('../../controllers/users');

router.post('/', usersController.register);

module.exports = router;
