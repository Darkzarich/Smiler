const router = require('express').Router();
const postsController = require('../../controllers/posts');
const auth = require('../auth');

router.get('/', postsController.getAll);
router.post('/', auth.required, postsController.create);
router.put('/', auth.required, postsController.update);

router.get('/:slug', postsController.getBySlug);

router.post('/upload', auth.required, postsController.upload);

module.exports = router;
