const router = require('express').Router();
const postsController = require('../../controllers/posts');

router.get('/', postsController.getAll);
router.post('/', postsController.create);

module.exports = router;
