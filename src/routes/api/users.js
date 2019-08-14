const router = require('express').Router();
const usersController = require('../../controllers/users');

router.get('/:username/posts', usersController.getUserPosts);

router.post('/', usersController.register);
router.post('/auth', usersController.auth);
router.delete('/', usersController.logout);

module.exports = router;
