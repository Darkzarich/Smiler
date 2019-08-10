const router = require('express').Router();
const usersController = require('../../controllers/users');

router.post('/', usersController.register);
router.post('/auth', usersController.auth);
router.delete('/', usersController.logout);

module.exports = router;
