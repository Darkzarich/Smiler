const router = require('express').Router();
const postsController = require('../../controllers/posts');
const auth = require('../auth');

router.get('/', postsController.getAll);
router.get('/:slug', postsController.getBySlug);

router.post('/', auth.required, postsController.create);
router.post('/upload', auth.required, postsController.upload);

module.exports = router;
