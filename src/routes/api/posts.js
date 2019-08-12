const router = require('express').Router();
const postsController = require('../../controllers/posts');
const auth = require('../auth');

router.get('/', postsController.getAll);
router.post('/', auth.required, postsController.create);

module.exports = router;
