const router = require('express').Router();
const usersController = require('../../controllers/users');
const auth = require('../auth');

router.get('/:login/template', auth.required, usersController.getUserPostTemplate);

router.post('/', usersController.register);
router.post('/auth', usersController.auth);

router.put('/:login/template', auth.required, usersController.updateUserPostTemplate);

router.delete('/', auth.required, usersController.logout);

module.exports = router;
