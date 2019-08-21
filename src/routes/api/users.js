const router = require('express').Router();
const usersController = require('../../controllers/users');
const auth = require('../auth');

router.get('/:login/template', auth.required, usersController.getUserPostTemplate);

router.post('/', usersController.register);
router.post('/auth', usersController.auth);
router.post('/logout', auth.required, usersController.logout);

router.put('/:login/template', auth.required, usersController.updateUserPostTemplate);


module.exports = router;
